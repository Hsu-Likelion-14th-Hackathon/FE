import { useState } from 'react'
import { Link, useParams } from 'react-router'

import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import { getProduct, getProductVariant } from '@/shared/data/products.js'
import { HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'
import ProductArtwork from '@/shared/ui/product-card/ProductArtwork.jsx'

import styles from './ProductDetailPage.module.scss'

function ChevronIcon({ direction }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 14">
      <circle cx="7" cy="7" fill="var(--mcm-color-canvas)" r="7" />
      <path
        d={direction === 'previous' ? 'M8 4.5 5.5 7 8 9.5' : 'M6 4.5 8.5 7 6 9.5'}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
      />
    </svg>
  )
}

export function Component() {
  const { productId } = useParams()
  const product = getProduct(productId)
  const [selectedVariants, setSelectedVariants] = useState({})
  const [wishlistOverrides, setWishlistOverrides] = useState({})
  const [addedVariantKey, setAddedVariantKey] = useState(null)

  if (!product) {
    return (
      <div className={styles.page}>
        <StoreHeader />
        <div className={styles.notFound}>
          <h1>상품 상세</h1>
          <p>요청한 상품을 찾을 수 없습니다.</p>
          <Link to="/products">상품 목록으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  const imageVariants = product.variants.filter(({ image }) => image)
  const selectedVariantId =
    selectedVariants[product.id] ?? product.cardVariantId ?? imageVariants[0].id
  const selectedVariant = getProductVariant(product, selectedVariantId)
  const selectedIndex = imageVariants.findIndex(({ id }) => id === selectedVariant.id)
  const wishlisted = wishlistOverrides[product.id] ?? product.initiallyWishlisted
  const variantKey = `${product.id}:${selectedVariant.id}`
  const addedToBag = addedVariantKey === variantKey

  const selectVariant = (variantId) => {
    setSelectedVariants((currentVariants) => ({
      ...currentVariants,
      [product.id]: variantId,
    }))
  }

  const moveGallery = (step) => {
    if (imageVariants.length < 2) return

    const nextIndex = (selectedIndex + step + imageVariants.length) % imageVariants.length
    selectVariant(imageVariants[nextIndex].id)
  }

  const toggleWishlist = () => {
    setWishlistOverrides((currentOverrides) => ({
      ...currentOverrides,
      [product.id]: !wishlisted,
    }))
  }

  return (
    <div className={styles.page}>
      <StoreHeader />

      <div className={styles.main}>
        <h1 className="sr-only">상품 상세</h1>

        <section aria-labelledby="product-name">
          <div className={styles.productMedia}>
            <span className={styles.collectionLabel}>{product.collectionLabel}</span>
            <ProductArtwork
              alt={`${product.name} ${selectedVariant.label}`}
              crop={selectedVariant.detailCrop}
              eager
              image={selectedVariant.image}
            />

            <button
              className={`${styles.wishlistButton} ${wishlisted ? styles.wishlisted : ''}`}
              type="button"
              aria-label={`위시리스트에 ${wishlisted ? '저장된 상품 삭제' : '상품 추가'}`}
              aria-pressed={wishlisted}
              onClick={toggleWishlist}
            >
              <HeartIcon className={styles.heartIcon} filled={wishlisted} />
            </button>

            <button
              className={`${styles.galleryButton} ${styles.previousButton}`}
              type="button"
              aria-label="이전 상품 이미지"
              disabled={imageVariants.length < 2}
              onClick={() => moveGallery(-1)}
            >
              <ChevronIcon direction="previous" />
            </button>
            <button
              className={`${styles.galleryButton} ${styles.nextButton}`}
              type="button"
              aria-label="다음 상품 이미지"
              disabled={imageVariants.length < 2}
              onClick={() => moveGallery(1)}
            >
              <ChevronIcon direction="next" />
            </button>

            <span className={styles.pagination} aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  className={index === selectedIndex ? styles.activeDot : styles.dot}
                  key={index}
                />
              ))}
            </span>
          </div>

          <div className={styles.productInformation}>
            <h2 id="product-name">{product.name}</h2>
            <p className={styles.price}>{product.priceLabel}</p>
            <p className={styles.stock}>{selectedVariant.stock}개 남음</p>
          </div>

          <div className={styles.actions}>
            <Link className={styles.tryOnLink} to={`/products/${product.id}/try-on`}>
              착용하기
            </Link>

            <p className={styles.variantSummary}>
              <span>
                색상: <strong>{selectedVariant.label}</strong>
              </span>
              <span>
                사이즈: <strong>프리 사이즈</strong>
              </span>
            </p>

            <div className={styles.variantList} aria-label="색상 선택">
              {imageVariants.map((variant) => {
                const selected = variant.id === selectedVariant.id

                return (
                  <button
                    className={`${styles.variantButton} ${selected ? styles.selectedVariant : ''}`}
                    key={variant.id}
                    type="button"
                    aria-label={`${variant.label} 색상 선택`}
                    aria-pressed={selected}
                    onClick={() => selectVariant(variant.id)}
                  >
                    <ProductArtwork crop={variant.thumbnailCrop} image={variant.image} />
                  </button>
                )
              })}
            </div>

            <button
              className={`${styles.addToBagButton} ${addedToBag ? styles.added : ''}`}
              type="button"
              aria-describedby="cart-feedback"
              onClick={() => setAddedVariantKey(variantKey)}
            >
              {addedToBag ? '쇼핑백에 담겼어요' : '쇼핑백에 추가'}
            </button>
            <p className="sr-only" id="cart-feedback" role="status" aria-live="polite">
              {addedToBag
                ? `${product.name} ${selectedVariant.label} 색상이 쇼핑백에 추가되었습니다.`
                : ''}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
