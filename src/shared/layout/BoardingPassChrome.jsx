import cartIcon from '@/shared/assets/boarding-pass/icons/cart.svg'
import heartIcon from '@/shared/assets/boarding-pass/icons/heart.svg'
import wordmarkLogo from '@/shared/assets/boarding-pass/icons/mcm-wordmark.svg'
import menuIcon from '@/shared/assets/boarding-pass/icons/menu.svg'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import BrandStrip from '@/shared/layout/brand-strip/BrandStrip.jsx'
import useStoreMenu from '@/shared/layout/store-menu/useStoreMenu.js'

import styles from './BoardingPassChrome.module.scss'

/**
 * 보딩패스 공통 크롬.
 * 타이틀 밴드: neurimbo 22px · #E2C5B0 계열 밝기 그라데이션(드롭섀도 없음)
 */
function BoardingPassChrome({
  showTitleBand = true,
  showIconRow = true,
  className = '',
  iconRowClassName = '',
}) {
  const { isOpen, toggleMenu, closeMenu } = useStoreMenu()
  const menuButtonRef = useRef(null)
  const wasMenuOpenRef = useRef(isOpen)

  useEffect(() => {
    if (wasMenuOpenRef.current && !isOpen) {
      menuButtonRef.current?.focus({ preventScroll: true })
    }

    wasMenuOpenRef.current = isOpen
  }, [isOpen])

  return (
    <header
      className={className}
      style={{
        paddingTop: 'var(--mcm-safe-top)',
        background: 'var(--mcm-color-canvas)',
      }}
    >
      {showTitleBand ? <BrandStrip as="heading" /> : null}

      {showIconRow ? (
        <div className={`${styles.iconRow} ${iconRowClassName}`}>
          <div className={styles.iconGroup}>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-controls="store-menu"
              aria-expanded={isOpen}
              onClick={toggleMenu}
              className={styles.iconAction}
            >
              <img src={menuIcon} alt="" className={styles.menuIcon} />
            </button>
          </div>
          <Link to="/" aria-label="MCM 메인" onClick={closeMenu} className={styles.logoLink}>
            <img src={wordmarkLogo} alt="" className={styles.wordmark} />
          </Link>
          <div className={`${styles.iconGroup} ${styles.iconGroupRight}`}>
            <Link
              to="/wishlist"
              aria-label="위시리스트"
              onClick={closeMenu}
              className={styles.iconAction}
            >
              <img src={heartIcon} alt="" className={styles.heartIcon} />
            </Link>
            <Link
              to="/cart"
              aria-label="장바구니"
              onClick={closeMenu}
              className={styles.iconAction}
            >
              <img src={cartIcon} alt="" className={styles.cartIcon} />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default BoardingPassChrome
