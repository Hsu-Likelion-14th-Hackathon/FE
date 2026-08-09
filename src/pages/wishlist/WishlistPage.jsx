import { useState } from 'react'
import { Link } from 'react-router'

import walletImage from '@/assets/images/products/aren-burgundy.webp'
import diamantImage from '@/assets/images/products/diamant-soft-pink.webp'
import weekenderImage from '@/assets/images/products/duffel-black.webp'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import CartWishlistTabs from '@/shared/ui/cart-wishlist-tabs/CartWishlistTabs.jsx'
import { HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'

import styles from './WishlistPage.module.scss'

const INITIAL_ITEMS = [
  {
    id: 'diamant-3d-charm',
    productId: 'mcm-001',
    name: 'Diamant 비세토스 3D 참',
    price: '₩490,000',
    image: diamantImage,
    cropClass: 'diamantCrop',
  },
  {
    id: 'ottomar-weekender',
    productId: 'mcm-006',
    name: 'Ottomar 비세토스 위켄더',
    price: '₩1,750,000',
    image: weekenderImage,
    cropClass: 'weekenderCrop',
  },
  {
    id: 'aren-card-wallet',
    productId: 'mcm-003',
    name: 'Aren 비세토스 카드 지갑',
    price: '₩290,000',
    image: walletImage,
    cropClass: 'walletCrop',
  },
]

function WishlistCard({ item, onRemove }) {
  const detailPath = `/products/${item.productId}`

  return (
    <li className={styles.card}>
      <div className={styles.imagePanel}>
        <span className={styles.collection}>NEW COLLECTION</span>
        <Link className={styles.imageLink} to={detailPath} aria-label={`${item.name} 상세 보기`}>
          <span className={`${styles.productCrop} ${styles[item.cropClass]}`}>
            <img src={item.image} alt="" />
          </span>
        </Link>
        <button
          className={styles.removeButton}
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`${item.name} 위시리스트에서 삭제`}
        >
          <HeartIcon className={styles.heart} filled />
        </button>
      </div>

      <Link className={styles.productInfo} to={detailPath}>
        <span className={styles.productName}>{item.name}</span>
        <span className={styles.price}>{item.price}</span>
      </Link>
    </li>
  )
}

export function Component() {
  const [items, setItems] = useState(INITIAL_ITEMS)
  const isEmpty = items.length === 0

  const removeItem = (itemId) => {
    setItems((currentItems) => currentItems.filter(({ id }) => id !== itemId))
  }

  return (
    <div className={styles.page}>
      <StoreHeader />
      <h1 className="sr-only">위시리스트</h1>
      <CartWishlistTabs active="wishlist" />

      <section className={styles.summary} aria-labelledby="wishlist-title">
        <h2 id="wishlist-title">고객님의 위시리스트</h2>
        <p aria-live="polite">
          {isEmpty ? '비어 있습니다' : `위시리스트에 ${items.length}개의 아이템이 있습니다`}
        </p>
      </section>

      {!isEmpty && (
        <ul className={styles.grid} aria-label="위시리스트 상품">
          {items.map((item) => (
            <WishlistCard item={item} key={item.id} onRemove={removeItem} />
          ))}
        </ul>
      )}

      {!isEmpty && <div className={styles.scrollFade} aria-hidden="true" />}
    </div>
  )
}
