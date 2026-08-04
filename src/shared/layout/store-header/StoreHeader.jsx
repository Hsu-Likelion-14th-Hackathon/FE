import { Link } from 'react-router'

import {
  CartIcon,
  HeartIcon,
  McmLogoIcon,
  MenuIcon,
  SearchIcon,
} from '@/shared/ui/icons/StoreIcons.jsx'

import styles from './StoreHeader.module.scss'

function BrandStrip() {
  return (
    <div className={styles.brandStrip} aria-hidden="true">
      <span className={styles.ornament}>· · ◆</span>
      <span className={styles.brandName}>MCM BOARDING PASS</span>
      <span className={styles.ornament}>◆ · ·</span>
    </div>
  )
}

function StoreHeader() {
  return (
    <header className={styles.header}>
      <BrandStrip />
      <nav className={styles.navigation} aria-label="주요 메뉴">
        <div className={styles.navigationInner}>
          <div className={styles.sideGroup} aria-hidden="true">
            <MenuIcon className={styles.icon} />
            <SearchIcon className={styles.icon} />
          </div>

          <Link className={styles.logoLink} to="/" aria-label="MCM 메인">
            <McmLogoIcon className={styles.logo} />
          </Link>

          <div className={styles.sideGroup}>
            <Link className={styles.iconLink} to="/wishlist" aria-label="위시리스트">
              <HeartIcon className={styles.icon} />
            </Link>
            <Link className={styles.iconLink} to="/cart" aria-label="쇼핑백">
              <CartIcon className={styles.icon} />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default StoreHeader
