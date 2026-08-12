import cartIcon from '@/shared/assets/boarding-pass/icons/cart.svg'
import heartIcon from '@/shared/assets/boarding-pass/icons/heart.svg'
import wordmarkLogo from '@/shared/assets/boarding-pass/icons/mcm-wordmark.svg'
import menuIcon from '@/shared/assets/boarding-pass/icons/menu.svg'
import searchIcon from '@/shared/assets/boarding-pass/icons/search.svg'
import DeferredButton from '@/shared/ui/DeferredButton.jsx'

import styles from './BoardingPassChrome.module.scss'

/**
 * 보딩패스 공통 크롬.
 * 타이틀 밴드: neurimbo 22px · #E2C5B0 계열 밝기 그라데이션(드롭섀도 없음)
 */
function BoardingPassChrome({
  onWishlistClick,
  onCartClick,
  showTitleBand = true,
  showIconRow = true,
  className = '',
  iconRowClassName = '',
}) {
  return (
    <header className={className}>
      {showTitleBand ? (
        <div className={styles.titleBand}>
          <span aria-hidden="true" className={styles.ornamentLeft}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.diamond} />
          </span>

          <h1 className={styles.title}>MCM BOARDING PASS</h1>

          <span aria-hidden="true" className={styles.ornamentRight}>
            <span className={styles.diamond} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </div>
      ) : null}

      {showIconRow ? (
        <div className={`${styles.iconRow} ${iconRowClassName}`}>
          <div className={styles.iconGroup}>
            <DeferredButton deferredId="D-04" aria-label="메뉴" className={styles.iconAction}>
              <img src={menuIcon} alt="" className={styles.menuIcon} />
            </DeferredButton>
            <DeferredButton deferredId="D-04" aria-label="검색" className={styles.iconAction}>
              <img src={searchIcon} alt="" className={styles.searchIcon} />
            </DeferredButton>
          </div>
          <img src={wordmarkLogo} alt="MCM" className={styles.wordmark} />
          <div className={`${styles.iconGroup} ${styles.iconGroupRight}`}>
            <button
              type="button"
              aria-label="위시리스트"
              onClick={onWishlistClick}
              className={styles.iconAction}
            >
              <img src={heartIcon} alt="" className={styles.heartIcon} />
            </button>
            <button
              type="button"
              aria-label="장바구니"
              onClick={onCartClick}
              className={styles.iconAction}
            >
              <img src={cartIcon} alt="" className={styles.cartIcon} />
            </button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default BoardingPassChrome
