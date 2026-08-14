import navNextImg from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrevImg from '@/shared/assets/boarding-pass/guide/nav-prev.svg'

import {
  BOARDING_PASS_STEP_LABELS,
  boardingPassStepProgress,
} from './boardingPassSteps.js'
import styles from './BoardingPassStepNav.module.scss'

/**
 * 비행 MAPS / 여행 가이드 공통 하단 가로 슬라이더.
 * 이전·다음·진행 바 클릭으로 1~6단계 이동.
 */
export default function BoardingPassStepNav({
  step,
  onPrev,
  onNext,
  onSelectStep,
  prevDisabled = false,
  nextDisabled = false,
  groupLabel,
  note,
}) {
  const progress = boardingPassStepProgress(step)

  return (
    <div className={styles.nav}>
      <div className={styles.navRow} role="group" aria-label={groupLabel}>
        <button
          type="button"
          aria-label="이전"
          disabled={prevDisabled}
          onClick={onPrev}
          className={styles.navBtn}
        >
          <img src={navPrevImg} alt="" className={styles.navBtnImg} />
        </button>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <div className={styles.progressHits} role="group" aria-label="여행 단계">
            {BOARDING_PASS_STEP_LABELS.map((label, index) => {
              const targetStep = index + 1
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={`${label}로 이동`}
                  aria-current={step === targetStep ? 'step' : undefined}
                  className={styles.progressHit}
                  onClick={() => onSelectStep?.(targetStep)}
                />
              )
            })}
          </div>
        </div>
        <button
          type="button"
          aria-label="다음"
          disabled={nextDisabled}
          onClick={onNext}
          className={styles.navBtn}
        >
          <img src={navNextImg} alt="" className={styles.navBtnImg} />
        </button>
      </div>
      <p className={styles.footerNote} aria-hidden={note ? undefined : true}>
        {note || '\u00a0'}
      </p>
    </div>
  )
}
