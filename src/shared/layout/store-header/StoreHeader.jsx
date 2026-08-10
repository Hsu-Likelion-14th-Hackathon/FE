import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import {
  CartIcon,
  HeartIcon,
  McmLogoIcon,
  MenuIcon,
  SearchIcon,
} from '@/shared/ui/icons/StoreIcons.jsx'
import useStoreMenu from '@/shared/layout/store-menu/useStoreMenu.js'

import styles from './StoreHeader.module.scss'

function BrandStrip() {
  return (
    <div className={styles.brandStrip} aria-hidden="true">
      <span className={`${styles.ornament} ${styles.ornamentLeft}`}>
        <i className={styles.ornamentDot} />
        <i className={styles.ornamentDot} />
        <i className={styles.ornamentDiamond} />
      </span>
      <span className={styles.brandName}>MCM BOARDING PASS</span>
      <span className={`${styles.ornament} ${styles.ornamentRight}`}>
        <i className={styles.ornamentDiamond} />
        <i className={styles.ornamentDot} />
        <i className={styles.ornamentDot} />
      </span>
    </div>
  )
}

function StoreHeader() {
  const { closeMenu, isOpen, toggleMenu } = useStoreMenu()
  const menuButtonRef = useRef(null)
  const wasMenuOpenRef = useRef(isOpen)

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
            <span aria-hidden="true">
              <SearchIcon className={styles.icon} />
            </span>
          </div>

          <Link className={styles.logoLink} to="/" aria-label="MCM 메인" onClick={closeMenu}>
            <McmLogoIcon className={styles.logo} />
          </Link>

          <div className={styles.sideGroup}>
            <Link
              className={styles.iconLink}
              to="/wishlist"
              aria-label="위시리스트"
              onClick={closeMenu}
            >
              <HeartIcon className={`${styles.icon} ${styles.heartIcon}`} />
            </Link>
            <Link className={styles.iconLink} to="/cart" aria-label="쇼핑백" onClick={closeMenu}>
              <CartIcon className={styles.icon} />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default StoreHeader
