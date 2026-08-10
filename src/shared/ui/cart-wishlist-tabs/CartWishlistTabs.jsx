import { Link } from 'react-router'

import { CartIcon, HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'

import styles from './CartWishlistTabs.module.scss'

const TABS = [
  {
    id: 'cart',
    label: '쇼핑백',
    to: '/cart',
  },
  {
    id: 'wishlist',
    label: '위시리스트',
    to: '/wishlist',
  },
]

function CartWishlistTabs({ active }) {
  return (
    <nav className={styles.tabs} aria-label="쇼핑백과 위시리스트">
      {TABS.map(({ id, label, to }) => {
        const isActive = active === id

        return (
          <Link
            className={`${styles.tab} ${styles[id]} ${isActive ? styles.active : styles.inactive}`}
            aria-current={isActive ? 'page' : undefined}
            key={id}
            to={to}
          >
            {id === 'cart' ? (
              <CartIcon className={styles.icon} />
            ) : (
              <HeartIcon className={styles.icon} />
            )}
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default CartWishlistTabs
