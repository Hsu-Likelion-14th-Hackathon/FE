import stageBg from '@/shared/assets/boarding-pass/stage-bg.png'

import styles from './BoardingPassStageBackdrop.module.scss'

/** (43)~(47) 공통 배경 — Figma 1025:293을 PNG로 구운 뒤 상단 바 아래에 깐다. */
function BoardingPassStageBackdrop() {
  return (
    <img
      src={stageBg}
      alt=""
      aria-hidden="true"
      className={styles.stageBg}
      data-testid="stage-bg"
    />
  )
}

export default BoardingPassStageBackdrop
