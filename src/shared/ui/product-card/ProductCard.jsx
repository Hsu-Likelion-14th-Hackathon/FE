import { Link } from 'react-router'

import { HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'

import ProductArtwork from './ProductArtwork.jsx'
import styles from './ProductCard.module.scss'

/** 컬렉션 표기는 디자인 문구다. 백엔드가 주는 값이 아니다. */
const COLLECTION_LABEL = 'NEW COLLECTION'

function GalleryArrow({ direction }) {
  return (
    <span className={`${styles.galleryArrow} ${styles[direction]}`} aria-hidden="true">
      <svg viewBox="0 0 10 10">
        <circle cx="5" cy="5" fill="var(--mcm-color-canvas)" r="5" />
        <path
          d={direction === 'previous' ? 'M5.8 3.2 4 5l1.8 1.8' : 'M4.2 3.2 6 5 4.2 6.8'}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.8"
        />
      </svg>
    </span>
  )
}

/**
 * 목록의 카드 한 장.
 *
 * 백엔드 목록은 색 단위로 내려온다. 한 장이 가리키는 것은 상품이 아니라
 * "그 상품의 그 색"이고, 위시리스트도 색 단위로 담긴다. 그래서 하트가 넘기는
 * 값은 productId가 아니라 productColorId다.
 */
function ProductCard({ priority = false, product, wishlisted, onWishlistToggle }) {
  const colors = product.colors ?? []

  return (
    <article className={styles.card}>
      <Link
        className={styles.cardLink}
        to={`/products/${product.id}`}
        aria-label={`${product.name}, ${product.priceLabel} 상세 보기`}
      >
        <span className={styles.media}>
          <span className={styles.collectionLabel}>{COLLECTION_LABEL}</span>
          <ProductArtwork eager={priority} image={product.thumbnailImageUrl} />
          <GalleryArrow direction="previous" />
          <GalleryArrow direction="next" />
          <span className={styles.pagination} aria-hidden="true">
            {Array.from({ length: Math.min(colors.length + 2, 7) }, (_, index) => (
              <span className={index === 0 ? styles.activeDot : styles.dot} key={index} />
            ))}
          </span>
        </span>

        <span className={styles.information}>
          <span className={styles.productName}>{product.name}</span>
          <span className={styles.price}>{product.priceLabel}</span>
          <span className={styles.swatches} aria-hidden="true">
            {colors.map((color) => (
              <span
                className={`${styles.swatch} ${
                  // 이 카드가 어느 색인지 표시한다. 첫 칸을 무조건 칠하면
                  // 같은 상품의 두 번째 색 카드가 첫 색을 고른 것처럼 보인다.
                  color.productColorId === product.productColorId ? styles.selectedSwatch : ''
                }`}
                key={color.productColorId}
                style={{ '--swatch-color': color.hex ?? 'var(--mcm-color-muted)' }}
              />
            ))}
          </span>
        </span>
      </Link>

      <button
        className={`${styles.wishlistButton} ${wishlisted ? styles.wishlisted : ''}`}
        type="button"
        aria-label={`${product.name} ${wishlisted ? '위시리스트에서 삭제' : '위시리스트에 추가'}`}
        aria-pressed={wishlisted}
        onClick={() => onWishlistToggle(product.productColorId)}
      >
        <HeartIcon className={styles.heartIcon} filled={wishlisted} />
      </button>
    </article>
  )
}

export default ProductCard
