import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useSession } from '@/entities/session/useSession.js'

import boardingArrow from '@/assets/icons/boarding-arrow.svg'
import circleArrow from '@/assets/icons/circle-arrow.svg'
import planeIcon from '@/assets/icons/plane.svg'
import collectionImage from '@/assets/images/home/aw26-collection.webp'
import cardPlaneImage from '@/assets/images/home/hero-card-plane.webp'

import styles from './StoreMenu.module.scss'

/**
 * 로그인 전에는 로그인 화면으로 보내고, 로그인한 뒤에는 로그아웃한다.
 *
 * 같은 자리에 두 가지를 두는 이유는, 로그인한 사람에게 "로그인"만 보이면
 * 지금 로그인된 상태인지 알 방법이 없기 때문이다.
 *
 * 확인이 끝나기 전에는 아무 글자도 바꾸지 않는다. 새로고침 직후 잠깐
 * "로그인"이 보였다가 "로그아웃"으로 바뀌면 방금 풀린 것처럼 보인다.
 */
function SessionAction({ onClose }) {
  const { isAuthenticated, isRestoring, signOut } = useSession()
  const navigate = useNavigate()

  if (isRestoring) {
    return (
      <span className={styles.loginButton} aria-hidden="true">
        &nbsp;
      </span>
    )
  }

  if (!isAuthenticated) {
    return (
      <Link className={styles.loginButton} to="/login" onClick={onClose}>
        로그인
      </Link>
    )
  }

  return (
    <button
      className={styles.loginButton}
      type="button"
      onClick={() => {
        signOut()
        onClose()
        // 보호 화면에 머문 채로 로그아웃하면 다음 요청부터 401이 쏟아진다.
        navigate('/', { replace: true })
      }}
    >
      로그아웃
    </button>
  )
}

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

function BoardingCard({ onClose, loadImages }) {
  return (
    <Link
      className={styles.contentGroup}
      to="/boarding-pass"
      aria-label="MCM Boarding Pass 둘러보기"
      onClick={onClose}
    >
      <div className={styles.boardingCard}>
        <div className={styles.cardPlaneFrame} aria-hidden="true">
          {loadImages ? <img src={cardPlaneImage} alt="" decoding="async" /> : null}
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

function CollectionCard({ onClose, loadImages }) {
  return (
    <Link className={styles.contentGroup} to="/products" onClick={onClose}>
      <div className={styles.collectionCard}>
        {loadImages ? (
          <img src={collectionImage} alt="인기상품 컬렉션 모델" decoding="async" />
        ) : null}
        <span>인기상품</span>
      </div>
      <ContentLink>인기상품 둘러보기</ContentLink>
    </Link>
  )
}

/**
 * 메뉴 카드 사진(약 130KB)을 언제 받을지.
 *
 * 메뉴는 여닫는 애니메이션 때문에 닫혀 있어도 늘 그려져 있어, 사진이 모든
 * 화면의 첫 로딩에 끼어 LCP 이미지·폰트와 대역폭을 다퉜다. 메뉴를 처음 열
 * 때, 또는 화면이 다 뜨고 브라우저가 한가해졌을 때 받는다.
 */
function useDeferredMenuImages(isOpen) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return undefined
    if (isOpen) {
      // 열려 있는 동안은 아래 반환값이 이미 true다. 닫힌 뒤에도 사진이
      // 사라지지 않게 다음 프레임에 기억해 둔다.
      const id = window.requestAnimationFrame(() => setReady(true))
      return () => window.cancelAnimationFrame(id)
    }
    let cancel = () => {}
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(() => setReady(true), { timeout: 4000 })
        cancel = () => window.cancelIdleCallback(id)
      } else {
        const id = window.setTimeout(() => setReady(true), 2000)
        cancel = () => window.clearTimeout(id)
      }
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
    return () => {
      window.removeEventListener('load', schedule)
      cancel()
    }
  }, [isOpen, ready])

  return ready || isOpen
}

function StoreMenu({ isOpen, onClose }) {
  const dialogRef = useRef(null)
  const loadImages = useDeferredMenuImages(isOpen)

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
              <BoardingCard onClose={onClose} loadImages={loadImages} />
              <CollectionCard onClose={onClose} loadImages={loadImages} />
              <SessionAction onClose={onClose} />
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default StoreMenu
