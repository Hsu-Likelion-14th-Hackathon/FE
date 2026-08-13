import { useCallback, useEffect, useRef, useState } from 'react'

import navNext from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrev from '@/shared/assets/boarding-pass/guide/nav-prev.svg'
import coverMcmSrc from '@/shared/assets/boarding-pass/passport/cover-mcm.png'
import coverWordSrc from '@/shared/assets/boarding-pass/passport/cover-passport.png'
import coverStarSrc from '@/shared/assets/boarding-pass/passport/cover-star.png'
import journeyDecorationSrc from '@/shared/assets/boarding-pass/passport/journey-decoration.png'
import journeyTicketSrc from '@/shared/assets/boarding-pass/passport/journey-ticket.png'
import hausSrc from '@/shared/assets/boarding-pass/passport/mcm-haus.png'
import bowLeftSrc from '@/shared/assets/boarding-pass/passport/passport-bow-left.png'
import bowRightSrc from '@/shared/assets/boarding-pass/passport/passport-bow-right.png'
import coverSrc from '@/shared/assets/boarding-pass/passport/passport-cover.png'
import emblemSrc from '@/shared/assets/boarding-pass/passport/passport-emblem.png'
import stampBowSrc from '@/shared/assets/boarding-pass/passport/passport-stamp-bow.png'
import pageLeftSrc from '@/shared/assets/boarding-pass/passport/passport-page-left.png'
import pageRightSrc from '@/shared/assets/boarding-pass/passport/passport-page-right.png'
import stampSrc from '@/shared/assets/boarding-pass/passport/passport-stamp.png'

import { usePassport } from '@/entities/passport/usePassport.js'

import { createPassportBook } from './passportBookScene.js'
import pageStyles from './PassportPage.module.scss'
import { facesForStep, paintFace } from './passportPageTexture.js'
import styles from './PassportPageTurn.module.scss'

const LAST_STEP = 3
const COMMIT_DURATION = 480
/** 표지를 여는 첫 동작은 더 천천히 — 책을 펼치는 순간이라 여운이 필요하다. */
const COVER_OPEN_DURATION = 820
const DIRECTION_LOCK_PX = 8
const MIN_FAST_DISTANCE_PX = 24
const FAST_VELOCITY_PX_MS = 0.45
const CANCEL_DURATION = 220

const IDLE_POINTER = {
  id: null,
  startX: 0,
  startY: 0,
  startedAt: 0,
  direction: null,
  progress: 0,
}

const ASSET_SOURCES = {
  cover: coverSrc,
  pageLeft: pageLeftSrc,
  pageRight: pageRightSrc,
  coverMcm: coverMcmSrc,
  coverStar: coverStarSrc,
  coverWord: coverWordSrc,
  emblem: emblemSrc,
  bowLeft: bowLeftSrc,
  bowRight: bowRightSrc,
  haus: hausSrc,
  stamp: stampSrc,
  stampBow: stampBowSrc,
  journeyDecoration: journeyDecorationSrc,
  journeyTicket: journeyTicketSrc,
}

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea'))
}

function shouldCommitTurn({ distance, elapsed, width }) {
  return (
    distance >= width * 0.25 ||
    (distance >= MIN_FAST_DISTANCE_PX && distance / Math.max(elapsed, 1) >= FAST_VELOCITY_PX_MS)
  )
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (typeof Image !== 'function') {
      resolve(null)
      return
    }
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

export default function PassportPageTurn({ step, disabled, onCommit, renderStep }) {
  const [rendererMode, setRendererMode] = useState('fallback')
  const [turnState, setTurnState] = useState('idle')

  const viewportRef = useRef(null)
  const canvasHostRef = useRef(null)
  const bookRef = useRef(null)
  const assetsRef = useRef({})
  const frameRef = useRef(null)
  const pointerRef = useRef({ ...IDLE_POINTER })
  // 같은 면을 반복해서 굽지 않도록 캔버스를 보관한다. 데이터가 바뀌면 비운다.
  const faceCacheRef = useRef(new Map())

  const progress = ((step + 1) / (LAST_STEP + 1)) * 100
  const inputLocked = disabled || turnState !== 'idle'

  // 여권 데이터는 API에서 온다. 연동 전에는 훅이 고정 데이터로 떨어진다.
  const { profile, stamps } = usePassport()
  const pageData = useCallback(
    () => ({ profile, stamps, assets: assetsRef.current }),
    [profile, stamps],
  )

  /** 현재 step과 넘어갈 방향에 맞춰 네 면을 굽고 책에 올린다. */
  const paintBook = useCallback(
    (direction = 0) => {
      const book = bookRef.current
      if (!book) return
      const data = pageData()
      const here = facesForStep(step)
      const there = facesForStep(step + direction)

      // 같은 면이라도 좌·우 어디에 놓이느냐에 따라 가죽 테두리 방향이 달라진다.
      const face = (name, side) => {
        if (!name) return null
        const key = `${name}:${side}`
        const cached = faceCacheRef.current.get(key)
        if (cached) return cached
        const painted = paintFace(name, data, side)
        faceCacheRef.current.set(key, painted)
        return painted
      }

      if (direction === 0) {
        book.setPages({ left: face(here.left, 'left'), right: face(here.right, 'right') })
        return
      }
      // 다음으로 넘길 땐 지금 오른쪽 장이 넘어가 다음의 왼쪽이 된다.
      book.setPages(
        direction > 0
          ? {
              left: face(here.left, 'left'),
              right: face(there.right, 'right'),
              turningFront: face(here.right, 'right'),
              turningBack: face(there.left, 'left'),
            }
          : {
              left: face(there.left, 'left'),
              right: face(here.right, 'right'),
              turningFront: face(there.right, 'right'),
              turningBack: face(here.left, 'left'),
            },
      )
    },
    [pageData, step],
  )

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const host = canvasHostRef.current
    const surface = viewport?.querySelector('[data-passport-surface]')
    if (!viewport || !host || !surface) return null
    // 캔버스는 stage 패딩 밖까지 넓어져 있으므로 그 크기를 기준으로 삼는다.
    const viewportRect = host.getBoundingClientRect()
    const surfaceRect = surface.getBoundingClientRect()
    const pageH = Math.max(surfaceRect.height, 1)
    const spread = step > 0
    // 표지는 화면 폭에 맞춘 한 장, 펼침은 그 절반이 한 면이다.
    const coverW = Math.max(surfaceRect.width, 1) * (spread ? 0.611 : 1)
    const spreadPageW = Math.max(surfaceRect.width, 1) * (spread ? 0.5 : 0.818)
    return {
      width: Math.max(viewportRect.width, 1),
      height: Math.max(viewportRect.height, 1),
      pageH,
      spread,
      // 현재 step의 배치와, 넘김이 끝났을 때의 배치
      cover: { pageW: coverW, shift: 0, spread: false },
      open: { pageW: spreadPageW, shift: spreadPageW / 2, spread: true },
    }
  }, [step])

  const drawFrame = useCallback(
    (direction, value) => {
      const book = bookRef.current
      const box = measure()
      if (!book || !box) return

      // 표지↔펼침은 폭도 위치도 달라서, 전환 중에는 두 배치를 섞어 그린다.
      // 그러지 않으면 애니메이션이 끝나는 순간 책이 순간이동한다.
      const nextStep = step + direction
      const from = step > 0 ? box.open : box.cover
      const to = direction === 0 ? from : nextStep > 0 ? box.open : box.cover
      const t = direction === 0 ? 0 : value
      const mix = (a, b) => a + (b - a) * t

      book.setSize(box.width, box.height, {
        pageW: mix(from.pageW, to.pageW),
        pageH: box.pageH,
        shift: mix(from.shift, to.shift),
        spread: from.spread || to.spread,
      })
      book.setTurn(value, direction)
      book.render()
    },
    [measure, step],
  )

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  const animateTo = useCallback(
    ({ direction, from, to, duration, commit }) => {
      // 백그라운드 탭에서는 rAF가 멈춰 전환이 끝나지 않는다. 결과만 확정한다.
      if (typeof document !== 'undefined' && document.hidden) {
        stopFrame()
        setTurnState('idle')
        if (commit) onCommit(direction)
        return
      }

      let startedAt = null
      const tick = (timestamp) => {
        if (startedAt === null) startedAt = timestamp
        const ratio = duration === 0 ? 1 : Math.min((timestamp - startedAt) / duration, 1)
        // easeInOutCubic — 손을 뗀 직후 갑자기 튀지 않고 끝에서 사뿐히 내려앉는다.
        const eased =
          ratio < 0.5 ? 4 * ratio * ratio * ratio : 1 - Math.pow(-2 * ratio + 2, 3) / 2
        drawFrame(direction, from + (to - from) * eased)

        if (ratio < 1) {
          frameRef.current = requestAnimationFrame(tick)
          return
        }
        frameRef.current = null
        setTurnState('idle')
        if (commit) onCommit(direction)
      }
      frameRef.current = requestAnimationFrame(tick)
    },
    [drawFrame, onCommit, stopFrame],
  )

  const requestTurn = useCallback(
    (direction, options = {}) => {
      const openingCover = step === 0 || step + direction === 0
      const {
        fromProgress = 0,
        commit = true,
        duration = openingCover ? COVER_OPEN_DURATION : COMMIT_DURATION,
      } = options
      const nextStep = step + direction
      const isActiveDrag = turnState === 'dragging' && Object.hasOwn(options, 'fromProgress')

      if (
        (disabled && (!isActiveDrag || commit)) ||
        nextStep < 0 ||
        nextStep > LAST_STEP ||
        (turnState !== 'idle' && !isActiveDrag)
      ) {
        return
      }

      if (rendererMode !== 'ready' || !bookRef.current) {
        if (commit) onCommit(direction)
        return
      }

      if (!isActiveDrag) paintBook(direction)
      setTurnState('settling')
      animateTo({ direction, from: fromProgress, to: commit ? 1 : 0, duration, commit })
    },
    [animateTo, disabled, onCommit, paintBook, rendererMode, step, turnState],
  )

  // 여권 데이터가 바뀌면 구워둔 면을 버린다.
  useEffect(() => {
    faceCacheRef.current.clear()
  }, [profile, stamps])

  // 페이지에 그릴 이미지들을 미리 받아둔다.
  useEffect(() => {
    let alive = true
    const names = Object.keys(ASSET_SOURCES)
    Promise.all(names.map((name) => loadImage(ASSET_SOURCES[name]))).then((loaded) => {
      if (!alive) return
      assetsRef.current = Object.fromEntries(names.map((name, index) => [name, loaded[index]]))
      faceCacheRef.current.clear()
      if (bookRef.current) {
        paintBook(0)
        drawFrame(0, 0)
      }
    })
    return () => {
      alive = false
    }
  }, [drawFrame, paintBook])

  useEffect(() => {
    const host = canvasHostRef.current
    if (!host || prefersReducedMotion()) return undefined

    let book
    try {
      book = createPassportBook()
    } catch (error) {
      console.warn('여권 3D 책을 초기화할 수 없어 정적 화면으로 대체합니다.', error)
      return undefined
    }

    book.canvas.className = styles.bookCanvas
    host.append(book.canvas)
    bookRef.current = book

    let alive = true
    queueMicrotask(() => {
      if (alive) setRendererMode('ready')
    })

    return () => {
      alive = false
      stopFrame()
      bookRef.current = null
      book.dispose()
    }
  }, [stopFrame])

  // step이 확정되면 정지 화면을 다시 굽는다.
  useEffect(() => {
    if (rendererMode !== 'ready') return
    paintBook(0)
    drawFrame(0, 0)
  }, [drawFrame, paintBook, rendererMode, step])

  const resetPointer = (event) => {
    pointerRef.current = { ...IDLE_POINTER }
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const onPointerDown = (event) => {
    if (disabled || turnState !== 'idle' || isInteractiveTarget(event.target)) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      direction: null,
      progress: 0,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event) => {
    const pointer = pointerRef.current
    if (pointer.id !== event.pointerId) return

    const dx = event.clientX - pointer.startX
    const dy = event.clientY - pointer.startY

    if (pointer.direction === null) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        resetPointer(event)
        return
      }
      const direction = dx < 0 ? 1 : -1
      if (step + direction < 0 || step + direction > LAST_STEP) {
        resetPointer(event)
        return
      }
      pointer.direction = direction
      if (rendererMode === 'ready' && bookRef.current) {
        paintBook(direction)
        setTurnState('dragging')
      }
    }

    const width = Math.max(event.currentTarget.getBoundingClientRect().width, 1)
    pointer.progress = Math.min(Math.abs(dx) / width, 1)
    if (rendererMode === 'ready') drawFrame(pointer.direction, pointer.progress)
    event.preventDefault()
  }

  const onPointerUp = (event) => {
    const pointer = pointerRef.current
    if (pointer.id !== event.pointerId) return

    const width = Math.max(event.currentTarget.getBoundingClientRect().width, 1)
    const distance = Math.abs(event.clientX - pointer.startX)
    const elapsed = performance.now() - pointer.startedAt
    resetPointer(event)
    if (pointer.direction === null) return

    const commit = !disabled && shouldCommitTurn({ distance, elapsed, width })
    const openingCover = step === 0 || step + pointer.direction === 0
    requestTurn(pointer.direction, {
      fromProgress: Math.min(distance / width, 1),
      commit,
      duration: commit ? (openingCover ? COVER_OPEN_DURATION : COMMIT_DURATION) : CANCEL_DURATION,
    })
  }

  const releaseWithoutCommit = (event) => {
    const pointer = pointerRef.current
    if (pointer.id !== event.pointerId) return
    pointerRef.current = { ...IDLE_POINTER }
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (pointer.direction === null) return
    requestTurn(pointer.direction, {
      fromProgress: pointer.progress,
      commit: false,
      duration: CANCEL_DURATION,
    })
  }

  return (
    <div
      className={styles.root}
      data-testid="passport-turn"
      data-renderer={rendererMode}
      data-turn-state={turnState}
    >
      <div
        ref={viewportRef}
        className={styles.viewport}
        data-open={step > 0}
        data-testid="passport-turn-surface"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={releaseWithoutCommit}
        onLostPointerCapture={releaseWithoutCommit}
      >
        {/* 캔버스가 책을 그리고, 같은 자리의 DOM은 투명하게 남아
            스크린리더 읽기와 버튼 클릭을 그대로 담당한다. */}
        <div ref={canvasHostRef} aria-hidden="true" className={styles.bookLayer} />
        <div className={styles.contentLayer} data-transparent={rendererMode === 'ready'}>
          {renderStep(step)}
        </div>
      </div>
      <nav className={pageStyles.navigation} aria-label="여권 단계 이동">
        <button
          type="button"
          aria-label="이전 단계"
          aria-disabled={inputLocked || undefined}
          disabled={step === 0}
          onClick={() => requestTurn(-1)}
        >
          <img src={navPrev} alt="" />
        </button>
        <div
          role="progressbar"
          aria-label="여권 진행률"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
          aria-valuetext={`${step + 1}단계 / 4단계`}
          className={pageStyles.progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <button
          type="button"
          aria-label="다음 단계"
          aria-disabled={inputLocked || undefined}
          disabled={step === LAST_STEP}
          onClick={() => requestTurn(1)}
        >
          <img src={navNext} alt="" />
        </button>
      </nav>
    </div>
  )
}
