import { useEffect, useState } from 'react'

import removeIcon from '@/assets/icons/state/remove.svg'
import selectionEmptyIcon from '@/assets/icons/state/selection-empty.svg'
import selectionSelectedIcon from '@/assets/icons/state/selection-selected.svg'
import { formatPrice } from '@/shared/api/productApi.js'
import { getShoppingBag, removeFromShoppingBag } from '@/shared/api/shoppingBagApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import CartWishlistTabs from '@/shared/ui/cart-wishlist-tabs/CartWishlistTabs.jsx'
import StateNotice from '@/shared/ui/state-notice/StateNotice.jsx'

import styles from './CartPage.module.scss'

function CartItem({ item, selected, onRemove, onToggle }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemControls}>
        <button
          className={styles.iconButton}
          type="button"
          aria-label={`${item.name} 선택`}
          aria-pressed={selected}
          onClick={() => onToggle(item.shoppingBagItemId)}
        >
          <img src={selected ? selectionSelectedIcon : selectionEmptyIcon} alt="" />
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label={`${item.name} 쇼핑백에서 삭제`}
          onClick={() => onRemove(item.shoppingBagItemId)}
        >
          <img className={styles.removeIcon} src={removeIcon} alt="" />
        </button>
      </div>

      <div className={styles.productRow}>
        <div className={styles.imagePanel}>
          {item.thumbnailImageUrl ? (
            <img
              alt=""
              className={styles.artworkImage}
              decoding="async"
              loading="lazy"
              src={item.thumbnailImageUrl}
            />
          ) : null}
        </div>

        <div className={styles.productDetails}>
          <div className={styles.detailsMain}>
            <div>
              <p className={styles.productName}>{item.name}</p>
              <p className={styles.price}>{formatPrice(item.price)}</p>
            </div>
            <div className={styles.options}>
              <span>{item.colorName}</span>
              <span>{item.sizeNote ? `${item.sizeLabel} / ${item.sizeNote}` : item.sizeLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sku}>{item.sku ? `#${item.sku}` : ''}</div>
    </li>
  )
}

export function Component() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  // '다시 시도'가 올릴 때마다 조회 effect가 다시 돈다.
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getShoppingBag({ signal: controller.signal })
      .then((list) => {
        if (controller.signal.aborted) return
        setItems(list)
        setError(null)
      })
      .catch((cause) => {
        if (cause?.name === 'AbortError') return
        setError(cause)
      })

    return () => controller.abort()
  }, [retryCount])

  const retryLoad = () => {
    setItems(null)
    setError(null)
    setRetryCount((count) => count + 1)
  }

  const toggleItem = (shoppingBagItemId) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(shoppingBagItemId)) nextIds.delete(shoppingBagItemId)
      else nextIds.add(shoppingBagItemId)

      return nextIds
    })
  }

  const removeItem = (shoppingBagItemId) => {
    const current = items ?? []
    const index = current.findIndex((item) => item.shoppingBagItemId === shoppingBagItemId)
    if (index < 0) return

    // 먼저 지우고 실패하면 제자리에 되돌린다. 서버에 없던 항목(removed=false)은
    // 이미 빠진 것과 같으므로 성공으로 둔다.
    const removed = current[index]
    setItems(current.filter((item) => item.shoppingBagItemId !== shoppingBagItemId))
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.delete(shoppingBagItemId)
      return nextIds
    })

    removeFromShoppingBag(shoppingBagItemId).catch(() => {
      setItems((now) => {
        const next = [...(now ?? [])]
        next.splice(Math.min(index, next.length), 0, removed)
        return next
      })
    })
  }

  const isEmpty = items?.length === 0
  const hasItems = (items?.length ?? 0) > 0

  return (
    <div className={styles.page}>
      <StoreHeader />
      <h1 className="sr-only">쇼핑백</h1>
      <CartWishlistTabs active="cart" />

      <section className={styles.summary} aria-labelledby="cart-title">
        <h2 id="cart-title">나의 쇼핑백{items ? ` (${items.length}개 품목)` : ''}</h2>
        <p aria-live="polite">
          {error
            ? ''
            : !items
              ? '쇼핑백을 불러오는 중입니다…'
              : isEmpty
                ? '쇼핑백이 비어 있습니다'
                : `쇼핑백에 ${items.length}개의 품목이 있습니다`}
        </p>
      </section>

      {/* 쇼핑백은 로그인해야 볼 수 있다. 토큰이 없으면 여기서 막힌다. */}
      {error ? (
        error.status === 401 ? (
          <StateNotice
            role="alert"
            eyebrow="Check-in"
            message="로그인이 필요한 공간입니다"
            hint="로그인하고 컬렉션 여정을 이어가세요"
            action={{ label: '로그인하기', to: '/login' }}
          />
        ) : (
          <StateNotice
            role="alert"
            eyebrow="Notice"
            message={error.message ?? '쇼핑백을 불러오지 못했습니다.'}
            hint="잠시 후 다시 시도해 주세요"
            action={{ label: '다시 시도', onClick: retryLoad }}
          />
        )
      ) : null}

      {isEmpty ? (
        <StateNotice
          eyebrow="Next flight"
          message="담긴 아이템이 없습니다"
          hint="다음 비행을 위한 아이템을 담아 보세요"
          action={{ label: '인기상품 보러가기', to: '/products' }}
        />
      ) : null}

      {hasItems && (
        <ul className={styles.itemList} aria-label="쇼핑백 상품">
          {items.map((item) => (
            <CartItem
              item={item}
              key={item.shoppingBagItemId}
              selected={selectedIds.has(item.shoppingBagItemId)}
              onRemove={removeItem}
              onToggle={toggleItem}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
