import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'

import { getProduct } from '@/shared/api/productApi.js'
import { addToShoppingBag } from '@/shared/api/shoppingBagApi.js'
import { addToWishlist, removeFromWishlist } from '@/shared/api/wishlistApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import { HeartIcon } from '@/shared/ui/icons/StoreIcons.jsx'
import ProductArtwork from '@/shared/ui/product-card/ProductArtwork.jsx'

import styles from './ProductDetailPage.module.scss'

/** 컬렉션 표기는 디자인 문구다. 백엔드가 주는 값이 아니다. */
const COLLECTION_LABEL = 'NEW COLLECTION'

/** 이보다 짧게 쓸면 넘기지 않는다. 탭하다 손이 미끄러진 것과 구분해야 한다. */
const SWIPE_THRESHOLD = 40

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

/**
 * 상품 상세.
 *
 * 백엔드는 색 안에 이미지와 사이즈를 중첩해 준다. 그래서 고르는 축이 둘이다.
 *   색     productColorId — 위시리스트와 AI 피팅이 쓴다
 *   사이즈 productSizeId  — 쇼핑백 담기가 쓴다
 *
 * 화살표와 쓸어 넘기기는 색 경계를 넘어 사진을 한 줄로 이어 넘긴다. 아래
 * 색 목록은 원하는 색으로 바로 건너뛸 때 쓴다.
 */
export function Component() {
  const { productId } = useParams()
  /**
   * 어느 상품의 결과인지 함께 들고 있는다.
   *
   * 로딩 여부를 따로 상태로 두면 효과 안에서 곧바로 setState를 해야 하는데,
   * 그러면 렌더가 연달아 돈다. 도착한 결과의 productId가 지금 주소와 다르면
   * 아직 오지 않은 것이므로, 그 비교만으로 로딩을 알 수 있다.
   */
  const [loaded, setLoaded] = useState(null)

  const [colorIndex, setColorIndex] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [sizeIndex, setSizeIndex] = useState(0)
  const [addedSizeId, setAddedSizeId] = useState(null)
  const [bagError, setBagError] = useState(null)
  /** 쓸어 넘기기 시작점. 그리는 값이 아니라 상태로 둘 이유가 없다. */
  const swipeRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    getProduct(productId, { signal: controller.signal })
      .then((found) => {
        if (controller.signal.aborted) return
        setLoaded({ productId, product: found, error: null })
        // 상품이 바뀌면 고른 색·사진·사이즈를 처음으로 되돌린다.
        setColorIndex(0)
        setImageIndex(0)
        setSizeIndex(0)
        setAddedSizeId(null)
        setBagError(null)
      })
      .catch((cause) => {
        if (cause?.name === 'AbortError') return
        setLoaded({ productId, product: null, error: cause })
      })

    return () => controller.abort()
  }, [productId])

  const loading = loaded?.productId !== productId
  const product = loaded?.product ?? null
  const error = loaded?.error ?? null

  if (loading) {
    return (
      <div className={styles.page}>
        <StoreHeader />
        <div className={styles.notFound}>
          <h1 className="sr-only">상품 상세</h1>
          <p role="status">상품을 불러오는 중입니다…</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className={styles.page}>
        <StoreHeader />
        <div className={styles.notFound}>
          <h1>상품 상세</h1>
          <p role="alert">
            {error && error.status !== 404
              ? (error.message ?? '상품을 불러오지 못했습니다.')
              : '요청한 상품을 찾을 수 없습니다.'}
          </p>
          <Link to="/products">상품 목록으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  const colors = product.colors ?? []
  const selectedColor = colors[colorIndex] ?? colors[0]
  const images = selectedColor?.images ?? []
  const sizes = selectedColor?.sizes ?? []
  const selectedSize = sizes[sizeIndex] ?? sizes[0]
  const wishlisted = Boolean(selectedColor?.isWished)
  const addedToBag = selectedSize && addedSizeId === selectedSize.productSizeId

  const selectColor = (index) => {
    setColorIndex(index)
    // 색을 바꾸면 사진 묶음도 사이즈 목록도 통째로 바뀐다.
    setImageIndex(0)
    setSizeIndex(0)
  }

  /**
   * 넘길 수 있는 화면을 한 줄로 편다.
   *
   * 색 안의 사진만 넘기면 대부분의 상품에서 화살표가 죽는다 — 실서버 상품은
   * 색마다 사진이 한 장씩이다. 색 경계를 넘어 이어서 넘긴다.
   */
  const frames = colors.flatMap((color, index) =>
    (color.images?.length ? color.images : [null]).map((_, imageOffset) => ({
      colorIndex: index,
      imageIndex: imageOffset,
    })),
  )
  const frameIndex = frames.findIndex(
    (frame) => frame.colorIndex === colorIndex && frame.imageIndex === imageIndex,
  )

  const moveGallery = (step) => {
    if (frames.length < 2) return

    const next = frames[(frameIndex + step + frames.length) % frames.length]
    if (next.colorIndex !== colorIndex) {
      setColorIndex(next.colorIndex)
      // 색이 바뀌면 사이즈 목록도 바뀐다. 고르던 자리를 그대로 두면 없는
      // 사이즈를 가리킨다.
      setSizeIndex(0)
    }
    setImageIndex(next.imageIndex)
  }

  /**
   * 손가락으로 옆으로 쓸어 넘긴다.
   *
   * 세로로 더 많이 움직였으면 페이지를 내리려던 손짓이므로 넘기지 않는다.
   * 기본 동작을 막지 않아 세로 스크롤은 그대로 남는다.
   */
  const onTouchStart = (event) => {
    const touch = event.touches[0]
    swipeRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event) => {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return
    moveGallery(deltaX < 0 ? 1 : -1)
  }

  const setColorWished = (productColorId, isWished) => {
    setLoaded((current) => ({
      ...current,
      product: {
        ...current.product,
        colors: current.product.colors.map((color) =>
          color.productColorId === productColorId ? { ...color, isWished } : color,
        ),
      },
    }))
  }

  const toggleWishlist = () => {
    if (!selectedColor) return

    const { productColorId } = selectedColor
    const wasWished = wishlisted
    setColorWished(productColorId, !wasWished)

    const request = wasWished ? removeFromWishlist : addToWishlist
    request(productColorId).catch(() => setColorWished(productColorId, wasWished))
  }

  const addToBag = () => {
    if (!selectedSize) return

    setBagError(null)
    addToShoppingBag(selectedSize.productSizeId)
      .then(() => setAddedSizeId(selectedSize.productSizeId))
      .catch((cause) => setBagError(cause.message ?? '쇼핑백에 담지 못했습니다.'))
  }

  return (
    <div className={styles.page}>
      <StoreHeader />

      <div className={styles.main}>
        <h1 className="sr-only">상품 상세</h1>

        <section aria-labelledby="product-name">
          <div className={styles.productMedia} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <span className={styles.collectionLabel}>{COLLECTION_LABEL}</span>
            <ProductArtwork
              alt={`${product.name} ${selectedColor?.label ?? ''}`}
              eager
              image={images[imageIndex] ?? images[0]}
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
              disabled={frames.length < 2}
              onClick={() => moveGallery(-1)}
            >
              <ChevronIcon direction="previous" />
            </button>
            <button
              className={`${styles.galleryButton} ${styles.nextButton}`}
              type="button"
              aria-label="다음 상품 이미지"
              disabled={frames.length < 2}
              onClick={() => moveGallery(1)}
            >
              <ChevronIcon direction="next" />
            </button>

            <span className={styles.pagination} aria-hidden="true">
              {frames.map((frame, index) => (
                <span
                  className={index === frameIndex ? styles.activeDot : styles.dot}
                  key={`${frame.colorIndex}-${frame.imageIndex}`}
                />
              ))}
            </span>
          </div>

          <div className={styles.productInformation}>
            <h2 id="product-name">{product.name}</h2>
            <p className={styles.price}>{product.priceLabel}</p>
            {/* 수량 미상(null)이면 아무 말도 하지 않는다. "0개 남음"은 거짓이다. */}
            {typeof selectedSize?.stock === 'number' ? (
              <p className={styles.stock}>{selectedSize.stock}개 남음</p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <Link className={styles.tryOnLink} to={`/products/${product.id}/try-on`}>
              Fitting with Ai
            </Link>

            <p className={styles.variantSummary}>
              <span>
                색상: <strong>{selectedColor?.label ?? ''}</strong>
              </span>
              <span>
                사이즈: <strong>{selectedSize?.label ?? ''}</strong>
              </span>
            </p>

            <div className={styles.variantList} aria-label="색상 선택">
              {colors.map((color, index) => {
                const selected = index === colorIndex

                return (
                  <button
                    className={`${styles.variantButton} ${selected ? styles.selectedVariant : ''}`}
                    key={color.productColorId}
                    type="button"
                    aria-label={`${color.label} 색상 선택`}
                    aria-pressed={selected}
                    onClick={() => selectColor(index)}
                  >
                    <ProductArtwork image={color.images?.[0]} />
                  </button>
                )
              })}
            </div>

            {/* 사이즈가 하나뿐이면 고를 것이 없다. 위 요약에 이미 적혀 있다. */}
            {sizes.length > 1 ? (
              <div className={styles.sizeList} aria-label="사이즈 선택">
                {sizes.map((size, index) => (
                  <button
                    className={`${styles.sizeButton} ${
                      index === sizeIndex ? styles.selectedSize : ''
                    }`}
                    key={size.productSizeId}
                    type="button"
                    aria-pressed={index === sizeIndex}
                    disabled={size.stock === 0}
                    onClick={() => setSizeIndex(index)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            ) : null}

            <button
              className={`${styles.addToBagButton} ${addedToBag ? styles.added : ''}`}
              type="button"
              aria-describedby="cart-feedback"
              disabled={!selectedSize || selectedSize.stock === 0}
              onClick={addToBag}
            >
              {selectedSize?.stock === 0
                ? '품절'
                : addedToBag
                  ? '쇼핑백에 담겼어요'
                  : '쇼핑백에 추가'}
            </button>
            <p className="sr-only" id="cart-feedback" role="status" aria-live="polite">
              {addedToBag
                ? `${product.name} ${selectedColor?.label ?? ''} 색상이 쇼핑백에 추가되었습니다.`
                : ''}
            </p>
            {bagError ? (
              <p className={styles.bagError} role="alert">
                {bagError}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
