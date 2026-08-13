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

import observeResize from '@/shared/layout/observe-resize.js'

import { usePassport } from '@/entities/passport/usePassport.js'

import { createPassportSheets } from './passportSheetScene.js'
import pageStyles from './PassportPage.module.scss'
import { SHEET_BACK, SHEET_FACES, SHEET_H, SHEET_W, paintFace } from './passportPageTexture.js'
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

/** 한 번 넘겨 본 사람에게 힌트를 다시 띄우지 않기 위한 표식. */
const HINT_SEEN_KEY = 'mcm-passport-swipe-hint-seen'

function readHintSeen() {
  // 사파리 비공개 모드처럼 저장이 막힌 환경에서도 화면은 떠야 한다.
  try {
    return localStorage.getItem(HINT_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export default function PassportPageTurn({ step, disabled, onCommit, renderStep }) {
  const [showHint, setShowHint] = useState(() => step === 0 && !readHintSeen())

  const dismissHint = useCallback(() => {
    setShowHint(false)
    try {
      localStorage.setItem(HINT_SEEN_KEY, '1')
    } catch {
      // 저장에 실패해도 이번 세션 동안은 숨어 있으면 충분하다.
    }
  }, [])

  const [rendererMode, setRendererMode] = useState('fallback')
  // 이미지 14장을 다 받았는지. 받고 나서 한 번 다시 구워야 빈 면이 남지 않는다.
  const [assetsReady, setAssetsReady] = useState(false)
  const [turnState, setTurnState] = useState('idle')

  const viewportRef = useRef(null)
  const canvasHostRef = useRef(null)
  const bookRef = useRef(null)
  const assetsRef = useRef({})
  const frameRef = useRef(null)
  // 지금 화면에 그려진 넘김 정도. 정수면 정지, 소수면 넘어가는 중이다.
  const turnRef = useRef(0)
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

  /** 네 장을 한 번에 굽고 장면에 올린다. 낱장은 step마다 다시 구울 일이 없다. */
  const paintSheets = useCallback(() => {
    const sheets = bookRef.current
    if (!sheets) return
    const data = pageData()

    const face = (name) => {
      const cached = faceCacheRef.current.get(name)
      if (cached) return cached
      const painted = paintFace(name, data, 'sheet')
      faceCacheRef.current.set(name, painted)
      return painted
    }

    // 앞면은 각 단계의 내용, 뒷면은 실제 여권처럼 빈 종이결이다.
    sheets.setSheets(SHEET_FACES.map((name) => ({ front: face(name), back: face(SHEET_BACK) })))
  }, [pageData])

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const host = canvasHostRef.current
    const surface = viewport?.querySelector('[data-passport-surface]')
    if (!viewport || !host || !surface) return null
    // 캔버스는 stage 패딩 밖까지 넓어져 있으므로 그 크기를 기준으로 삼는다.
    const viewportRect = host.getBoundingClientRect()
    const surfaceRect = surface.getBoundingClientRect()
    const leafH = Math.max(surfaceRect.height, 1)
    return {
      width: Math.max(viewportRect.width, 1),
      height: Math.max(viewportRect.height, 1),
      leafH,
      // 장은 설계 비율을 지킨다. 높이가 정해지면 폭도 따라온다.
      leafW: (leafH * SHEET_W) / SHEET_H,
    }
  }, [])

  /**
   * 캔버스 버퍼 크기를 맞추고, DOM 오버레이가 쓸 배율을 알린다.
   *
   * 프레임마다 부르면 안 된다. setSize는 내부에서 setPixelRatio까지 거쳐
   * 버퍼를 다시 잡으므로 넘김 도중 매 프레임 재할당이 일어난다.
   */
  const fitToBox = useCallback(() => {
    const sheets = bookRef.current
    const host = canvasHostRef.current
    const box = measure()
    if (!sheets || !box || !host) return

    sheets.setSize(box.width, box.height, { leafW: box.leafW, leafH: box.leafH })
    // 내지 좌표는 설계 394 기준 rem이라 화면이 짧아 지면이 줄면 그림과 어긋난다.
    // 오버레이 전체를 같은 배율로 줄이도록 값을 넘긴다.
    host.parentElement?.style.setProperty('--passport-scale', String(box.leafH / SHEET_H))
  }, [measure])

  const drawFrame = useCallback((turned) => {
    const sheets = bookRef.current
    if (!sheets) return
    // 넘김 중에 다시 굽는 일이 생겨도 손이 놓인 지점으로 돌아올 수 있게 남긴다.
    turnRef.current = turned
    sheets.setTurn(turned)
    sheets.render()
  }, [])

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
        const eased = ratio < 0.5 ? 4 * ratio * ratio * ratio : 1 - Math.pow(-2 * ratio + 2, 3) / 2
        drawFrame(from + (to - from) * eased)

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

      // 넘김은 슬라이드든 화살표든 키보드든 전부 여기를 지난다. 한 번이라도
      // 넘겼으면 방법을 안 것이므로 안내를 거둔다. 아이패드처럼 터치와 키보드를
      // 함께 쓰는 기기에서는 화살표로 넘기고도 안내가 남아 있었다.
      if (commit) dismissHint()

      if (rendererMode !== 'ready' || !bookRef.current) {
        if (commit) onCommit(direction)
        return
      }

      setTurnState('settling')
      // drawFrame은 넘어간 장 수를 받는다. 드래그 중이면 손이 놓인 지점에서
      // 이어받아, 확정이면 다음 장으로 취소면 제자리로 미끄러진다.
      animateTo({
        direction,
        from: step + direction * fromProgress,
        to: step + direction * (commit ? 1 : 0),
        duration,
        commit,
      })
    },
    [animateTo, disabled, dismissHint, onCommit, rendererMode, step, turnState],
  )

  // 여권 데이터가 바뀌면 구워둔 면을 버린다.
  useEffect(() => {
    faceCacheRef.current.clear()
  }, [profile, stamps])

  // 페이지에 그릴 이미지들을 미리 받아둔다. 14장이라 단계마다 다시 받으면
  // 모바일에서 눈에 띄게 끊긴다. 한 번만 받고 준비됐다는 사실만 알린다.
  useEffect(() => {
    let alive = true
    const names = Object.keys(ASSET_SOURCES)
    Promise.all(names.map((name) => loadImage(ASSET_SOURCES[name]))).then((loaded) => {
      if (!alive) return
      assetsRef.current = Object.fromEntries(names.map((name, index) => [name, loaded[index]]))
      faceCacheRef.current.clear()
      setAssetsReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const host = canvasHostRef.current
    if (!host || prefersReducedMotion()) return undefined

    let book
    try {
      book = createPassportSheets()
    } catch (error) {
      console.warn('여권 3D 낱장을 초기화할 수 없어 정적 화면으로 대체합니다.', error)
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

  // 장은 내용이 바뀔 때만 다시 굽는다. setSheets는 네 장과 텍스처 여덟 장을
  // 통째로 새로 만들므로 단계마다 부르면 낭비고, 드래그 중에 끼어들면 장면이
  // 원래 단계로 되돌아간다.
  useEffect(() => {
    if (rendererMode !== 'ready') return
    paintSheets()
    fitToBox()
    // 넘김 도중에 이미지나 여권 데이터가 도착할 수 있다. step으로 되돌리면
    // 손이 놓인 장이 원위치로 튄다. 그려져 있던 값을 그대로 이어 그린다.
    drawFrame(turnRef.current)
  }, [assetsReady, drawFrame, fitToBox, paintSheets, rendererMode])

  // 단계가 확정되면 각도만 바꿔 다시 그린다.
  useEffect(() => {
    if (rendererMode !== 'ready') return
    drawFrame(step)
  }, [drawFrame, rendererMode, step])

  // 화면이 돌아가거나 창이 바뀔 때만 캔버스 버퍼를 다시 잡는다. 이걸 안 하면
  // 기존 버퍼가 CSS로 늘어나 흐려진다.
  useEffect(() => {
    const host = canvasHostRef.current
    if (rendererMode !== 'ready' || !host) return undefined
    return observeResize(host, () => {
      fitToBox()
      drawFrame(turnRef.current)
    })
  }, [drawFrame, fitToBox, rendererMode])

  const resetPointer = (event) => {
    pointerRef.current = { ...IDLE_POINTER }
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const onPointerDown = (event) => {
    if (disabled || turnState !== 'idle' || isInteractiveTarget(event.target)) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // 손을 댄 순간 방법을 안 것이므로 힌트는 물러난다.
    if (showHint) dismissHint()
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
      if (rendererMode === 'ready' && bookRef.current) setTurnState('dragging')
    }

    const width = Math.max(event.currentTarget.getBoundingClientRect().width, 1)
    pointer.progress = Math.min(Math.abs(dx) / width, 1)
    if (rendererMode === 'ready') drawFrame(step + pointer.direction * pointer.progress)
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
        {/* 모바일에는 넘김 화살표가 없어 슬라이드가 유일한 방법이다.
            처음 한 번만 알려주고, 한 장이라도 넘기면 다시 띄우지 않는다. */}
        {showHint ? (
          <p className={styles.swipeHint} role="status">
            옆으로 슬라이드 해보세요
          </p>
        ) : null}
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
