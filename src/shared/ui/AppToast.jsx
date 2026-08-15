import { useCallback, useEffect, useRef, useState } from 'react'

import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'

import styles from './AppToast.module.scss'

const POSITION_CLASS = {
  bottom: 'bottom-[max(5.75rem,var(--mcm-safe-bottom))]',
  center: 'top-1/2 -translate-y-1/2',
  top: 'top-[max(28px,var(--mcm-safe-top))]',
}

const EXIT_MS = 320

/**
 * 토스트 공통 컨테이너.
 * - X로 닫기
 * - closeOnOutsideClick(기본 true)일 때 외부 클릭으로 닫기
 * - duration(ms)이 있으면 해당 시간 후 페이드아웃하며 닫힘 (즉시 삭제 아님)
 */
function AppToast({
  position = 'bottom',
  onClose,
  className = '',
  duration,
  closeOnOutsideClick = true,
  children,
}) {
  const panelRef = useRef(null)
  const closingRef = useRef(false)
  const [entered, setEntered] = useState(false)
  const [exiting, setExiting] = useState(false)

  const beginClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setExiting(true)
    window.setTimeout(() => onClose(), EXIT_MS)
  }, [onClose])

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!closeOnOutsideClick) return undefined
    function handlePointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        beginClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [beginClose, closeOnOutsideClick])

  useEffect(() => {
    if (duration == null || duration <= 0) return undefined
    const timer = window.setTimeout(() => beginClose(), duration)
    return () => window.clearTimeout(timer)
  }, [duration, beginClose])

  const visible = entered && !exiting

  return (
    <div
      className={`${styles.host} ${POSITION_CLASS[position] ?? POSITION_CLASS.bottom} ${visible ? styles.hostVisible : ''} ${exiting ? styles.hostExiting : ''}`}
      role="status"
    >
      <div
        ref={panelRef}
        className={`relative rounded-xl bg-[rgba(25,25,25,0.92)] px-4 py-3.5 text-[#fafafa] shadow-[0_4px_14px_rgba(0,0,0,0.3)] ${className}`}
      >
        <button
          type="button"
          aria-label="토스트 닫기"
          onClick={beginClose}
          className="absolute top-2.5 right-2.5 grid size-5 place-items-center"
        >
          <img src={closeIcon} alt="" className="size-3 invert" />
        </button>
        {children}
      </div>
    </div>
  )
}

export default AppToast
