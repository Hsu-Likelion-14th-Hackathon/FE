import { Link } from 'react-router'

import { HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'

import ProductArtwork from './ProductArtwork.jsx'
import styles from './ProductCard.module.scss'

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

function ProductCard({ priority = false, product, wishlisted, onWishlistToggle }) {
  const cardVariant = product.variants.find(({ id }) => id === product.cardVariantId)
  const artworkVariant = cardVariant?.image
    ? cardVariant
    : product.variants.find(({ image }) => image)

  return (
    <article className={styles.card}>
      <Link
        className={styles.cardLink}
        to={`/products/${product.id}`}
        aria-label={`${product.name}, ${product.priceLabel} 상세 보기`}
      >
        <span className={styles.media}>
          <span className={styles.collectionLabel}>{product.collectionLabel}</span>
          <ProductArtwork
            crop={artworkVariant.cardCrop}
            eager={priority}
            image={artworkVariant.image}
          />
          <GalleryArrow direction="previous" />
          <GalleryArrow direction="next" />
          <span className={styles.pagination} aria-hidden="true">
            {Array.from({ length: Math.min(product.variants.length + 2, 7) }, (_, index) => (
              <span className={index === 0 ? styles.activeDot : styles.dot} key={index} />
            ))}
          </span>
        </span>

        <span className={styles.information}>
          <span className={styles.productName}>{product.name}</span>
          <span className={styles.price}>{product.priceLabel}</span>
          <span className={styles.swatches} aria-hidden="true">
            {product.variants.map((variant, index) => (
              <span
                className={`${styles.swatch} ${index === 0 ? styles.selectedSwatch : ''}`}
                key={variant.id}
                style={{ '--swatch-color': variant.swatch }}
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
        onClick={() => onWishlistToggle(product.id)}
      >
        <HeartIcon className={styles.heartIcon} filled={wishlisted} />
      </button>
    </article>
  )
}

export default ProductCard
