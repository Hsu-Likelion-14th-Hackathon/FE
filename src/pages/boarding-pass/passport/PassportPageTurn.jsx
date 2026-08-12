import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Group, MathUtils, PerspectiveCamera, Scene } from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'

import navNext from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrev from '@/shared/assets/boarding-pass/guide/nav-prev.svg'

import pageStyles from './PassportPage.module.scss'
import styles from './PassportPageTurn.module.scss'

const LAST_STEP = 3
const COMMIT_DURATION = 480

export default function PassportPageTurn({ step, disabled, onCommit, renderStep }) {
  const [rendererMode, setRendererMode] = useState('fallback')
  const [turnState, setTurnState] = useState('idle')
  const [targetStep, setTargetStep] = useState(null)
  const [hosts, setHosts] = useState({ current: null, target: null })
  const viewportRef = useRef(null)
  const rendererMountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const pivotRef = useRef(null)
  const currentObjectRef = useRef(null)
  const targetObjectRef = useRef(null)
  const currentHostRef = useRef(null)
  const targetHostRef = useRef(null)
  const frameRef = useRef(null)
  const resizeRef = useRef(() => {})
  const fallbackRef = useRef(() => {})

  const renderScene = useCallback(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    if (renderer && scene && camera) renderer.render(scene, camera)
  }, [])

  const applyProgress = useCallback(
    (direction, progress) => {
      const pivot = pivotRef.current
      const targetObject = targetObjectRef.current
      if (!pivot || !targetObject) return
      targetObject.rotation.y = direction > 0 ? Math.PI : -Math.PI
      pivot.rotation.y = -direction * Math.PI * progress
      renderScene()
    },
    [renderScene],
  )

  const resizeScene = useCallback(() => {
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const pivot = pivotRef.current
    const currentObject = currentObjectRef.current
    const targetObject = targetObjectRef.current
    const viewport = viewportRef.current
    const surface = currentHostRef.current?.querySelector('[data-passport-surface]')
    if (
      !renderer ||
      !camera ||
      !pivot ||
      !currentObject ||
      !targetObject ||
      !viewport ||
      !surface
    ) {
      return
    }

    const viewportRect = viewport.getBoundingClientRect()
    const surfaceRect = surface.getBoundingClientRect()
    const width = Math.max(viewportRect.width, 1)
    const height = Math.max(viewportRect.height, 1)
    const pivotX =
      step === 0
        ? surfaceRect.left - viewportRect.left
        : surfaceRect.left - viewportRect.left + surfaceRect.width / 2
    const cameraDistance = height / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)))

    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.position.set(0, 0, cameraDistance)
    camera.updateProjectionMatrix()
    pivot.position.x = pivotX - width / 2
    currentObject.position.x = -pivot.position.x
    targetObject.position.x = -pivot.position.x
    renderScene()
  }, [renderScene, step])

  const settleTurn = useCallback(
    ({ direction, fromProgress, toProgress, duration, commit }) => {
      let startedAt = null
      const tick = (timestamp) => {
        if (startedAt === null) startedAt = timestamp
        const elapsed = timestamp - startedAt
        const ratio = duration === 0 ? 1 : Math.min(elapsed / duration, 1)
        applyProgress(direction, fromProgress + (toProgress - fromProgress) * ratio)

        if (ratio < 1) {
          frameRef.current = requestAnimationFrame(tick)
          return
        }

        frameRef.current = null
        pivotRef.current.rotation.y = 0
        targetObjectRef.current.visible = false
        setTargetStep(null)
        setTurnState('idle')
        if (commit) onCommit(direction)
      }
      frameRef.current = requestAnimationFrame(tick)
    },
    [applyProgress, onCommit],
  )

  const requestTurn = useCallback(
    (direction, options = {}) => {
      const { fromProgress = 0, commit = true, duration = COMMIT_DURATION } = options
      const nextStep = step + direction
      if (disabled || nextStep < 0 || nextStep > LAST_STEP || turnState !== 'idle') {
        return
      }

      if (rendererMode !== 'ready') {
        if (commit) onCommit(direction)
        return
      }

      targetObjectRef.current.visible = true
      setTargetStep(nextStep)
      setTurnState('settling')
      settleTurn({ direction, fromProgress, toProgress: commit ? 1 : 0, duration, commit })
    },
    [disabled, onCommit, rendererMode, settleTurn, step, turnState],
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const rendererMount = rendererMountRef.current
    const hasNoCss3d =
      typeof CSS === 'undefined' ||
      typeof CSS.supports !== 'function' ||
      CSS.supports('transform-style', 'preserve-3d') === false
    const prefersReducedMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!viewport || !rendererMount || hasNoCss3d || prefersReducedMotion) {
      return undefined
    }

    let observer
    let mounted = true
    const teardown = () => {
      observer?.disconnect()
      observer = undefined
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      rendererRef.current?.domElement.remove()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      pivotRef.current = null
      currentObjectRef.current = null
      targetObjectRef.current = null
      currentHostRef.current = null
      targetHostRef.current = null
    }
    const fallback = (error) => {
      teardown()
      console.warn('Passport page renderer is unavailable; using fallback.', error)
      queueMicrotask(() => {
        if (!mounted) return
        setTargetStep(null)
        setTurnState('idle')
        setRendererMode('fallback')
      })
    }
    fallbackRef.current = fallback
    try {
      const renderer = new CSS3DRenderer()
      const scene = new Scene()
      const camera = new PerspectiveCamera(40, 1, 1, 4000)
      const pivot = new Group()
      const currentHost = document.createElement('div')
      const targetHost = document.createElement('div')
      const currentObject = new CSS3DObject(currentHost)
      const targetObject = new CSS3DObject(targetHost)

      currentHostRef.current = currentHost
      targetHostRef.current = targetHost
      currentHost.className = styles.host
      targetHost.className = `${styles.host} ${styles.target}`
      targetObject.visible = false
      pivot.add(currentObject, targetObject)
      scene.add(pivot)
      renderer.domElement.className = styles.renderer
      rendererMount.append(renderer.domElement)

      rendererRef.current = renderer
      sceneRef.current = scene
      cameraRef.current = camera
      pivotRef.current = pivot
      currentObjectRef.current = currentObject
      targetObjectRef.current = targetObject

      observer = new ResizeObserver(() => {
        try {
          resizeRef.current()
        } catch (error) {
          fallback(error)
        }
      })
      observer.observe(viewport)
      queueMicrotask(() => {
        if (!mounted) return
        setHosts({ current: currentHost, target: targetHost })
        setRendererMode('ready')
      })
    } catch (error) {
      fallback(error)
    }

    return () => {
      mounted = false
      teardown()
      fallbackRef.current = () => {}
    }
  }, [])

  useLayoutEffect(() => {
    resizeRef.current = resizeScene
    if (rendererMode === 'ready') {
      try {
        resizeScene()
      } catch (error) {
        fallbackRef.current(error)
      }
    }
  }, [rendererMode, resizeScene, targetStep])

  const progress = (step + 1) * 25
  const inputLocked = disabled || turnState !== 'idle'

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
      >
        <div ref={rendererMountRef} />
        {rendererMode === 'ready' && hosts.current
          ? createPortal(<div className={styles.face}>{renderStep(step)}</div>, hosts.current)
          : null}
        {rendererMode === 'ready' && hosts.target && targetStep !== null
          ? createPortal(
              <div className={`${styles.face} ${styles.target}`} aria-hidden="true" inert={true}>
                {renderStep(targetStep)}
              </div>,
              hosts.target,
            )
          : null}
        {rendererMode === 'fallback' ? (
          <div className={styles.fallback}>{renderStep(step)}</div>
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
