import { useEffect, useState } from 'react'

import LoadingRingSpinner from '@/features/boarding-pass/loading-ring/LoadingRingSpinner.jsx'
import loadingDots from '@/shared/assets/boarding-pass/issue/loading-spinner.svg'

import styles from './IssueLoadingOverlay.module.scss'

/** Figma (30)/(31)/(32) 진행바 너비 비율 — 0 / 100/270 / 270/270 */
const PROGRESS_STAGES = [0, 37.037, 100]

/**
 * 설문 최종 제출 후 발급 API 대기 중 풀스크린 오버레이 (30)~(32).
 * 로딩 링은 LoadingRingSpinner로 공용한다.
 * 모바일에서는 동적 뷰포트(100dvh)를 채워 안드로이드 하단 바가 접혀도 흰 여백이 보이지 않게 한다.
 * 전환 타이밍은 SurveyPage의 API 완료 네비게이션을 그대로 유지한다.
 */
function IssueLoadingOverlay() {
  const [progress, setProgress] = useState(PROGRESS_STAGES[0])

  useEffect(() => {
    document.documentElement.classList.add('mcm-issue-loading')
    return () => document.documentElement.classList.remove('mcm-issue-loading')
  }, [])

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
        <img
          className={styles.dots}
          src={loadingDots}
          alt=""
          width={14}
          height={14}
          aria-hidden="true"
        />
      </div>

      <LoadingRingSpinner placed="center" />

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
