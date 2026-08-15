import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { formatPrice } from '@/shared/api/productApi.js'
import { getWishlist, removeFromWishlist } from '@/shared/api/wishlistApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import ScrollFade from '@/shared/ui/scroll-fade/ScrollFade.jsx'
import CartWishlistTabs from '@/shared/ui/cart-wishlist-tabs/CartWishlistTabs.jsx'
import { HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'
import StateNotice from '@/shared/ui/state-notice/StateNotice.jsx'

import styles from './WishlistPage.module.scss'

function WishlistCard({ item, onRemove }) {
  const detailPath = `/products/${item.productId}`

  return (
    <li className={styles.card}>
      <div className={styles.imagePanel}>
        <span className={styles.collection}>NEW COLLECTION</span>
        <Link className={styles.imageLink} to={detailPath} aria-label={`${item.name} 상세 보기`}>
          {item.thumbnailImageUrl ? (
            <img
              alt=""
              className={styles.artworkImage}
              decoding="async"
              loading="lazy"
              src={item.thumbnailImageUrl}
            />
          ) : null}
        </Link>
        <button
          className={styles.removeButton}
          type="button"
          onClick={() => onRemove(item.productColorId)}
          aria-label={`${item.name} 위시리스트에서 삭제`}
        >
          <HeartIcon className={styles.heart} filled />
        </button>
      </div>

      <Link className={styles.productInfo} to={detailPath}>
        <span className={styles.productName}>{item.name}</span>
        <span className={styles.price}>{formatPrice(item.price)}</span>
      </Link>
    </li>
  )
}

export function Component() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  // '다시 시도'가 올릴 때마다 조회 effect가 다시 돈다.
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getWishlist({ signal: controller.signal })
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

  const removeItem = (productColorId) => {
    const current = items ?? []
    const index = current.findIndex((item) => item.productColorId === productColorId)
    if (index < 0) return

    // 먼저 지우고 실패하면 제자리에 되돌린다. 서버에 없던 항목(removed=false)은
    // 이미 빠진 것과 같으므로 성공으로 둔다.
    const removed = current[index]
    setItems(current.filter((item) => item.productColorId !== productColorId))

    removeFromWishlist(productColorId).catch(() => {
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
      <h1 className="sr-only">위시리스트</h1>
      <CartWishlistTabs active="wishlist" />

      <section className={styles.summary} aria-labelledby="wishlist-title">
        <h2 id="wishlist-title">고객님의 위시리스트</h2>
        <p aria-live="polite">
          {error
            ? ''
            : !items
              ? '위시리스트를 불러오는 중입니다…'
              : isEmpty
                ? '비어 있습니다'
                : `위시리스트에 ${items.length}개의 아이템이 있습니다`}
        </p>
      </section>

      {/* 위시리스트는 로그인해야 볼 수 있다. 토큰이 없으면 여기서 막힌다. */}
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
            message={error.message ?? '위시리스트를 불러오지 못했습니다.'}
            hint="잠시 후 다시 시도해 주세요"
            action={{ label: '다시 시도', onClick: retryLoad }}
          />
        )
      ) : null}

      {isEmpty ? (
        <StateNotice
          eyebrow="Next flight"
          message="아직 담긴 아이템이 없습니다"
          hint="마음에 든 아이템을 하트로 담아 두세요"
          action={{ label: '신상품 보러가기', to: '/products' }}
        />
      ) : null}

      {hasItems && (
        <ul className={styles.grid} aria-label="위시리스트 상품">
          {items.map((item) => (
            <WishlistCard item={item} key={item.productColorId} onRemove={removeItem} />
          ))}
        </ul>
      )}

      {hasItems && <ScrollFade />}
    </div>
  )
}
