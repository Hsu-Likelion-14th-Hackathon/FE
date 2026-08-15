import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import collectionImage from '@/assets/images/home/aw26-collection.webp'
import { getProducts, toRepresentativeList } from '@/shared/api/productApi.js'
import { addToWishlist, removeFromWishlist } from '@/shared/api/wishlistApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import ProductCard from '@/shared/ui/product-card/ProductCard.jsx'
import ScrollFade from '@/shared/ui/scroll-fade/ScrollFade.jsx'

import styles from './ProductListPage.module.scss'

const collectionDescription =
  '회고적이면서도 미래지향적인 2026 가을-겨울 컬렉션은 뮌헨의 문화와 음악을 통해 MCM 50주년을 기념하며, 최첨단 소재와 미래지향적인 스타일을 조화롭게 담아냈습니다. 스터드 디테일의 실루엣과 혁신적인 가죽 제품은 예술과 기술, 여행이 교차하는 하우스의 정체성을 드러냅니다.'

export function Component() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    getProducts({ signal: controller.signal })
      .then((list) => {
        if (controller.signal.aborted) return
        // 같은 상품의 색이 여러 줄로 오므로 대표색 한 줄만 세운다.
        // 나머지 색은 상세에서 고른다.
        setProducts(toRepresentativeList(list))
        setError(null)
      })
      .catch((cause) => {
        if (cause?.name === 'AbortError') return
        setError(cause)
      })

    return () => controller.abort()
  }, [])

  const setWished = (productColorId, isWished) => {
    setProducts((current) =>
      (current ?? []).map((product) =>
        product.productColorId === productColorId ? { ...product, isWished } : product,
      ),
    )
  }

  const toggleWishlist = (productColorId) => {
    // 지금 그려진 값에서 읽는다. setProducts 업데이터 안에서 읽으면 그 함수가
    // 호출 즉시 실행되지 않아 늘 초깃값을 보게 되고, 담긴 것을 눌러도 다시
    // 담는 요청이 나간다.
    const target = (products ?? []).find((item) => item.productColorId === productColorId)
    if (!target) return

    const wasWished = target.isWished
    setWished(productColorId, !wasWished)

    const request = wasWished ? removeFromWishlist : addToWishlist
    request(productColorId).catch(() => setWished(productColorId, wasWished))
  }

  return (
    <div className={styles.page}>
      <StoreHeader />

      <div className={styles.main}>
        <h1 className="sr-only">상품 목록</h1>

        <div className={styles.collectionTabs} aria-label="상품 컬렉션">
          <span className={styles.activeTab}>신상품</span>
          <span className={styles.inactiveTab}>Autumn Winter 2026</span>
        </div>

        <section aria-labelledby="aw26-title">
          <h2 className="sr-only" id="aw26-title">
            Autumn Winter 2026
          </h2>
          <img
            alt="2026 가을-겨울 컬렉션을 착용한 다섯 모델"
            className={styles.collectionImage}
            decoding="async"
            fetchPriority="high"
            src={collectionImage}
          />
          <div className={styles.collectionDescription}>
            <p>{collectionDescription}</p>
          </div>
        </section>

        <section className={styles.productGrid} aria-label="신상품" aria-busy={!products && !error}>
          {(products ?? []).map((product, index) => (
            <ProductCard
              key={product.productColorId}
              onWishlistToggle={toggleWishlist}
              priority={index < 2}
              product={product}
              wishlisted={product.isWished}
            />
          ))}
        </section>

        {error ? (
          <p className={styles.status} role="alert">
            {/* 목록은 로그인해야 볼 수 있다. 토큰이 없으면 여기서 막힌다. */}
            {error.status === 401 ? (
              <>
                상품을 보려면 로그인이 필요합니다. <Link to="/login">로그인하기</Link>
              </>
            ) : (
              (error.message ?? '상품을 불러오지 못했습니다.')
            )}
          </p>
        ) : null}

        {!products && !error ? (
          <p className={styles.status} role="status">
            상품을 불러오는 중입니다…
          </p>
        ) : null}

        {products?.length === 0 ? <p className={styles.status}>등록된 상품이 없습니다.</p> : null}
      </div>

      <ScrollFade />
    </div>
  )
}
