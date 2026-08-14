import navNextImg from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrevImg from '@/shared/assets/boarding-pass/guide/nav-prev.svg'

import styles from './BoardingPassStepNav.module.scss'

/**
 * 비행 MAPS / 여행 가이드 공통 하단 가로 슬라이더.
 * 이전·다음과 진행 바. 가이드 카피는 note로 넘긴다.
 */
export default function BoardingPassStepNav({
  progress,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  groupLabel,
  note,
}) {
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
