import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import boardingArrow from '@/assets/icons/boarding-arrow.svg'
import circleArrow from '@/assets/icons/circle-arrow.svg'
import planeIcon from '@/assets/icons/plane.svg'
import collectionImage from '@/assets/images/home/aw26-collection.webp'
import cardPlaneImage from '@/assets/images/home/hero-card-plane.webp'

import styles from './StoreMenu.module.scss'

const focusableElementSelector = [
  'a[href]',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function ContentLink({ children }) {
  return (
    <div className={styles.contentLink}>
      <span>{children}</span>
      <img src={circleArrow} alt="" />
    </div>
  )
}

function BoardingCard({ onClose }) {
  return (
    <Link
      className={styles.contentGroup}
      to="/boarding-pass/intro"
      aria-label="MCM Boarding Pass 둘러보기"
      onClick={onClose}
    >
      <div className={styles.boardingCard}>
        <div className={styles.cardPlaneFrame} aria-hidden="true">
          <img src={cardPlaneImage} alt="" />
        </div>
        <img className={styles.cardPlaneIcon} src={planeIcon} alt="" />
        <p className={styles.cardTitle} aria-hidden="true">
          <span>MCM</span>
          <span>BOARDING</span>
          <span>PASS</span>
        </p>
        <div className={styles.cardFlightPath} aria-hidden="true" />
        <span className={styles.boardingButton} aria-hidden="true">
          <span>Boarding</span>
          <img src={boardingArrow} alt="" />
        </span>
      </div>
      <ContentLink>MCM BOARDING PASS</ContentLink>
    </Link>
  )
}

function CollectionCard({ onClose }) {
  return (
    <Link className={styles.contentGroup} to="/products" onClick={onClose}>
      <div className={styles.collectionCard}>
        <img src={collectionImage} alt="2026 가을-겨울 컬렉션 모델" />
        <span>Autumn Winter 2026</span>
      </div>
      <ContentLink>2026 가을-겨울 컬렉션 둘러보기</ContentLink>
    </Link>
  )
}

function StoreMenu({ isOpen, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const dialogElement = dialogRef.current

    function handleKeyDown(event) {
      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = dialogElement?.querySelectorAll(focusableElementSelector)
      if (!focusableElements?.length) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (
        event.shiftKey &&
        (document.activeElement === firstElement || document.activeElement === dialogElement)
      ) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    const firstFocusableElement = dialogElement?.querySelector(focusableElementSelector)

    if (firstFocusableElement) {
      firstFocusableElement.focus({ preventScroll: true })
    } else {
      dialogElement?.focus({ preventScroll: true })
    }
    dialogElement?.addEventListener('keydown', handleKeyDown)

    return () => dialogElement?.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div
      ref={dialogRef}
      id="store-menu"
      className={styles.menuLayer}
      data-state={isOpen ? 'open' : 'closed'}
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
      aria-hidden={!isOpen}
      inert={!isOpen}
      tabIndex={-1}
    >
      <button
        className={styles.backdrop}
        type="button"
        aria-label="메뉴 배경 닫기"
        tabIndex={-1}
        onClick={onClose}
      />
      <div className={styles.drawerViewport}>
        <div className={styles.menuPanel}>
          <nav aria-label="전체 메뉴 탐색">
            <div className={styles.menuContent}>
              <BoardingCard onClose={onClose} />
              <CollectionCard onClose={onClose} />
              <Link className={styles.loginButton} to="/login" onClick={onClose}>
                로그인
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default StoreMenu
