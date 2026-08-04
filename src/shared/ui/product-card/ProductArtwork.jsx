import styles from './ProductCard.module.scss'

function ProductArtwork({ alt = '', crop, eager = false, image }) {
  const artworkStyle = {
    '--product-frame-width': crop.frameWidth,
    '--product-frame-aspect': crop.frameAspect,
    '--product-frame-left': crop.frameLeft,
    '--product-frame-bottom': crop.frameBottom,
    '--product-image-width': crop.imageWidth,
    '--product-image-left': crop.imageLeft,
    '--product-image-top': crop.imageTop,
  }

  return (
    <span className={styles.artwork} style={artworkStyle}>
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
