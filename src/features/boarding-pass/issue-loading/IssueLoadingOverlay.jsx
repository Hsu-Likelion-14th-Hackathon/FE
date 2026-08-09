import { useEffect, useState } from 'react'

import loadingDots from '@/shared/assets/boarding-pass/issue/loading-spinner.svg'

import styles from './IssueLoadingOverlay.module.scss'

/** Figma (30)/(31)/(32) 진행바 너비 비율 — 0 / 100/270 / 270/270 */
const PROGRESS_STAGES = [0, 37.037, 100]

/**
 * 설문 최종 제출 후 발급 API 대기 중 풀스크린 오버레이 (30)~(32).
 * 피그마 익스포트 SVG의 #FAFAFA/#898989 사각형이 흰 상자로 보이던 문제를
 * CSS conic-gradient 링으로 대체해 해결한다.
 * 전환 타이밍은 SurveyPage의 API 완료 네비게이션을 그대로 유지한다.
 */
function IssueLoadingOverlay() {
  const [progress, setProgress] = useState(PROGRESS_STAGES[0])

  useEffect(() => {
    const mid = window.setTimeout(() => setProgress(PROGRESS_STAGES[1]), 450)
    const full = window.setTimeout(() => setProgress(PROGRESS_STAGES[2]), 1100)
    return () => {
      window.clearTimeout(mid)
      window.clearTimeout(full)
    }
  }, [])

  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="보딩패스 발급 중">
      <div className={styles.loadingRow}>
        <p className={styles.loadingLabel}>Loading</p>
        <img className={styles.dots} src={loadingDots} alt="" width={14} height={14} aria-hidden="true" />
      </div>

      <div className={styles.spinner} aria-hidden="true">
        <div className={styles.ring} />
        {/* conic 링 흰색 선두에 stroke 폭과 같은 둥근 캡 */}
        <span className={styles.tip} />
      </div>

      <p className={styles.caption}>
        <span className={styles.captionLine}>고객님을 위한</span>
        <span className={styles.captionLine}>
          <span className={styles.accent}>BOARDING PASS</span>를 발급중 입니다
        </span>
      </p>

      <div className={styles.progress}>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.labels}>
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}

export default IssueLoadingOverlay
