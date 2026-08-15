import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import BrandStrip from '@/shared/layout/brand-strip/BrandStrip.jsx'
import useStoreMenu from '@/shared/layout/store-menu/useStoreMenu.js'
import { CartIcon, HeartIcon, McmLogoIcon, MenuIcon } from '@/shared/ui/icons/StoreIcons.jsx'

import styles from './StoreHeader.module.scss'

function StoreHeader({ onWishlistClick, onCartClick } = {}) {
  const { closeMenu, isOpen, toggleMenu } = useStoreMenu()
  const menuButtonRef = useRef(null)
  const wasMenuOpenRef = useRef(isOpen)

  function handleWishlistClick(event) {
    closeMenu()
    if (!onWishlistClick) return
    event.preventDefault()
    onWishlistClick()
  }

  function handleCartClick(event) {
    closeMenu()
    if (!onCartClick) return
    event.preventDefault()
    onCartClick()
  }

  useEffect(() => {
    if (wasMenuOpenRef.current && !isOpen) {
      menuButtonRef.current?.focus({ preventScroll: true })
    }

    wasMenuOpenRef.current = isOpen
  }, [isOpen])

  return (
    <header className={styles.header}>
      <BrandStrip />
      <nav className={styles.navigation} aria-label="주요 메뉴">
        <div className={styles.navigationInner}>
          <div className={styles.sideGroup}>
            <button
              ref={menuButtonRef}
              className={`${styles.iconLink} ${styles.iconButton}`}
              type="button"
              aria-controls="store-menu"
              aria-expanded={isOpen}
              aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
              onClick={toggleMenu}
            >
              <MenuIcon className={styles.icon} />
            </button>
          </div>

          <Link className={styles.logoLink} to="/" aria-label="MCM 메인" onClick={closeMenu}>
            <McmLogoIcon className={styles.logo} />
          </Link>

          <div className={styles.sideGroup}>
            <Link
              className={`${styles.iconLink} ${styles.swapLink}`}
              to="/wishlist"
              aria-label="위시리스트"
              onClick={handleWishlistClick}
            >
              <HeartIcon className={`${styles.icon} ${styles.heartIcon} ${styles.swapIcon}`} />
              <span aria-hidden="true" className={styles.swapLabel}>
                위시리스트
              </span>
            </Link>
            <Link
              className={`${styles.iconLink} ${styles.swapLink}`}
              to="/cart"
              aria-label="쇼핑백"
              onClick={handleCartClick}
            >
              <CartIcon className={`${styles.icon} ${styles.swapIcon}`} />
              <span aria-hidden="true" className={styles.swapLabel}>
                쇼핑백
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default StoreHeader
