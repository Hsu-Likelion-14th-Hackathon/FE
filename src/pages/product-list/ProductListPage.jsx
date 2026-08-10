import { useState } from 'react'

import collectionImage from '@/assets/images/home/aw26-collection.webp'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import { products } from '@/shared/data/products.js'
import ProductCard from '@/shared/ui/product-card/ProductCard.jsx'

import styles from './ProductListPage.module.scss'

const collectionDescription =
  '회고적이면서도 미래지향적인 2026 가을-겨울 컬렉션은 뮌헨의 문화와 음악을 통해 MCM 50주년을 기념하며, 최첨단 소재와 미래지향적인 스타일을 조화롭게 담아냈습니다. 스터드 디테일의 실루엣과 혁신적인 가죽 제품은 예술과 기술, 여행이 교차하는 하우스의 정체성을 드러냅니다.'

export function Component() {
  const [wishlistedProductIds, setWishlistedProductIds] = useState(
    () =>
      new Set(
        products.filter(({ initiallyWishlisted }) => initiallyWishlisted).map(({ id }) => id),
      ),
  )

  const toggleWishlist = (productId) => {
    setWishlistedProductIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(productId)) {
        nextIds.delete(productId)
      } else {
        nextIds.add(productId)
      }

      return nextIds
    })
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

        <section className={styles.productGrid} aria-label="신상품">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              onWishlistToggle={toggleWishlist}
              priority={index < 2}
              product={product}
              wishlisted={wishlistedProductIds.has(product.id)}
            />
          ))}
        </section>
      </div>
    </div>
  )
}
