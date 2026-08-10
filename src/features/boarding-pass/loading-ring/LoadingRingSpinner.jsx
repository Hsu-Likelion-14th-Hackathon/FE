import styles from './LoadingRingSpinner.module.scss'

/**
 * 보딩패스 로딩 링 (설문 발급 / 스캔 이륙 공용).
 * conic-gradient 흰색 선두(3시)에 stroke 폭과 같은 tip을 맞춘다.
 */
function LoadingRingSpinner({ className = '', placed = 'flow' }) {
  const placedClass = placed === 'center' ? styles.placedCenter : ''

  return (
    <div className={`${styles.spinner} ${placedClass} ${className}`.trim()} aria-hidden="true">
      <div className={styles.ring} />
      <span className={styles.tip} />
    </div>
  )
}

export default LoadingRingSpinner
