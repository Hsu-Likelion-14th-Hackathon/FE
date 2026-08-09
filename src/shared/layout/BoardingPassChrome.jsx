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
        <div className={`flex h-12 items-center bg-[#fafafa] px-5 ${iconRowClassName}`}>
          <div className="flex flex-1 items-center gap-5">
            <DeferredButton deferredId="D-04" aria-label="메뉴">
              <img src={menuIcon} alt="" className="h-[1.125rem] w-[1.375rem]" />
            </DeferredButton>
            <DeferredButton deferredId="D-04" aria-label="검색">
              <img src={searchIcon} alt="" className="size-[1.3125rem]" />
            </DeferredButton>
          </div>
          <img src={wordmarkLogo} alt="MCM" className="h-5" />
          <div className="flex flex-1 items-center justify-end gap-5">
            <button type="button" aria-label="위시리스트" onClick={onWishlistClick}>
              <img src={heartIcon} alt="" className="size-6" />
            </button>
            <button type="button" aria-label="장바구니" onClick={onCartClick}>
              <img src={cartIcon} alt="" className="size-[1.375rem]" />
            </button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default BoardingPassChrome
