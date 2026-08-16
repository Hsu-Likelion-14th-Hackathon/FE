import styles from './ProductCard.module.scss'

/**
 * 상품 사진.
 *
 * 예전에는 이미지마다 손으로 맞춘 크롭 박스를 CSS 변수로 받았다. 로컬 자산이
 * 라이프스타일 컷이라 가방만 떼어내 앉히려면 그 보정이 필요했다.
 *
 * 백엔드 사진은 카탈로그 컷이다. 18장이 모두 1000×1083에 밝은 배경, 가운데
 * 정렬이라 보정할 것이 없다. 칸을 채우고 넘치는 위아래(약 9%)만 잘라 낸다.
 * 여백까지 사진에 들어 있어 카드 배경색과 이어 붙일 필요도 없다.
 */
function ProductArtwork({ alt = '', eager = false, image }) {
  if (!image) return null

  return (
    <span className={styles.artwork}>
      <span className={styles.artworkFrame}>
        <img
          alt={alt}
          className={styles.artworkImage}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          loading={eager ? 'eager' : 'lazy'}
          src={image}
        />
      </span>
    </span>
  )
}

export default ProductArtwork
