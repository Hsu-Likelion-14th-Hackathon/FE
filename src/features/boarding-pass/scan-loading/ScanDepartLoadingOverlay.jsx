import { useEffect, useState } from 'react'

import styles from './ScanDepartLoadingOverlay.module.scss'

/**
 * 스캔 성공 후 「비행 이륙하기」 탭 시 동선 탐색 로딩 (38)~(40).
 * progress 0 → 100 연출 후 onComplete.
 */
function ScanDepartLoadingOverlay({ onComplete, durationMs = 2200 }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const started = performance.now()

    function tick(now) {
      const ratio = Math.min(1, (now - started) / durationMs)
      // ease-out으로 초반 가속 후 마무리
      const eased = 1 - (1 - ratio) ** 2
      setProgress(Math.round(eased * 100))
      if (ratio < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      onComplete?.()
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs, onComplete])

  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-label="비행 동선 탐색 중"
    >
      <div className={styles.loadingLabel}>
        <p className={styles.loadingText}>Loading</p>
        <span className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </div>

      <div className={styles.spinner} aria-hidden="true">
        <div
          className={styles.ring}
          style={{
            background:
              'conic-gradient(from 90deg, rgba(250,250,250,1) 0deg, rgb(255,219,160) 171deg, rgba(255,219,160,0) 360deg)',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 0.75rem), #000 calc(100% - 0.6875rem))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 0.75rem), #000 calc(100% - 0.6875rem))',
          }}
        />
        <span className={styles.spinnerCap} />
      </div>

      <p className={styles.message}>
        고객님을 위한
        <br />
        <span className={styles.highlight}>최적의 비행 동선</span>을 찾고 있습니다
      </p>

      <div className={styles.progressBlock}>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.percentRow}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}

export default ScanDepartLoadingOverlay
