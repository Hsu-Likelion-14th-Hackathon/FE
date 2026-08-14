import { useState } from 'react'

import removeIcon from '@/assets/icons/state/remove.svg'
import selectionEmptyIcon from '@/assets/icons/state/selection-empty.svg'
import selectionSelectedIcon from '@/assets/icons/state/selection-selected.svg'
import pinaImage from '@/assets/images/state/cart-pina.webp'
import slidesImage from '@/assets/images/state/cart-slides.webp'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import CartWishlistTabs from '@/shared/ui/cart-wishlist-tabs/CartWishlistTabs.jsx'

import styles from './CartPage.module.scss'

const INITIAL_CART_ITEMS = [
  {
    id: 'pina-tambourine-bag',
    name: 'Pina 비세토스 탬버린 백',
    price: '₩1,690,000',
    color: 'COGNAC',
    size: 'S',
    sku: '#MWRGAOB01CO001',
    image: pinaImage,
    cropClass: 'pinaCrop',
  },
  {
    id: 'monogram-rubber-slide',
    name: '모노그램 프린트 러버 슬라이드',
    price: '₩350,000',
    color: 'SOFT PINK',
    size: '36 IT / 여성',
    sku: '#MESGSMM04PZ036',
    image: slidesImage,
    cropClass: 'slidesCrop',
  },
]

function CartItem({ item, selected, onRemove, onToggle }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemControls}>
        <button
          className={styles.iconButton}
          type="button"
          aria-label={`${item.name} 선택`}
          aria-pressed={selected}
          onClick={() => onToggle(item.id)}
        >
          <img src={selected ? selectionSelectedIcon : selectionEmptyIcon} alt="" />
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label={`${item.name} 쇼핑백에서 삭제`}
          onClick={() => onRemove(item.id)}
        >
          <img className={styles.removeIcon} src={removeIcon} alt="" />
        </button>
      </div>

      <div className={styles.productRow}>
        <div className={styles.imagePanel}>
          <span className={`${styles.productCrop} ${styles[item.cropClass]}`}>
            <img src={item.image} alt="" />
          </span>
        </div>

        <div className={styles.productDetails}>
          <div className={styles.detailsMain}>
            <div>
              <p className={styles.productName}>{item.name}</p>
              <p className={styles.price}>{item.price}</p>
            </div>
            <div className={styles.options}>
              <span>{item.color}</span>
              <span>{item.size}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sku}>{item.sku}</div>
    </li>
  )
}

export function Component() {
  const [items, setItems] = useState(INITIAL_CART_ITEMS)
  const [selectedIds, setSelectedIds] = useState(() => new Set([INITIAL_CART_ITEMS[0].id]))
  const isEmpty = items.length === 0

  const toggleItem = (itemId) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(itemId)) nextIds.delete(itemId)
      else nextIds.add(itemId)

      return nextIds
    })
  }

  const removeItem = (itemId) => {
    setItems((currentItems) => currentItems.filter(({ id }) => id !== itemId))
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.delete(itemId)
      return nextIds
    })
  }

  return (
    <div className={styles.page}>
      <StoreHeader />
      <h1 className="sr-only">쇼핑백</h1>
      <CartWishlistTabs active="cart" />

      <section className={styles.summary} aria-labelledby="cart-title">
        <h2 id="cart-title">나의 쇼핑백 ({items.length}개 품목)</h2>
        <p aria-live="polite">
          {isEmpty ? '쇼핑백이 비어 있습니다' : `쇼핑백에 ${items.length}개의 품목이 있습니다`}
        </p>
      </section>

      {!isEmpty && (
        <ul className={styles.itemList} aria-label="쇼핑백 상품">
          {items.map((item) => (
            <CartItem
              item={item}
              key={item.id}
              selected={selectedIds.has(item.id)}
              onRemove={removeItem}
              onToggle={toggleItem}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
