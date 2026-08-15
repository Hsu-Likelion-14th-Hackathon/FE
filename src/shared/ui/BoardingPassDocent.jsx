import { useState } from 'react'

import docentPlayImg from '@/shared/assets/boarding-pass/flight/docent-play.svg'
import docentStopImg from '@/shared/assets/boarding-pass/flight/docent-stop.svg'

import styles from './BoardingPassDocent.module.scss'

/**
 * 음성 AI 도슨트 UI Mock (M-01).
 * 실제 음성 재생은 하지 않고 재생/정지 상태만 표현한다.
 */
export default function BoardingPassDocent() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className={styles.docentBlock}>
      <p className={styles.docentHint}>음성 AI 도슨트가 고객님의 여정을 안내합니다</p>
      <div className={styles.docentControls} data-deferred-id="M-01">
        <button
          type="button"
          aria-label="도슨트 재생"
          aria-pressed={playing}
          className={styles.playBtn}
          onClick={() => setPlaying(true)}
        >
          <span aria-hidden="true" className={styles.playFill} />
          <img src={docentPlayImg} alt="" className={styles.playIcon} />
        </button>
        <button
          type="button"
          aria-label="도슨트 정지"
          aria-pressed={!playing}
          className={styles.stopBtn}
          onClick={() => setPlaying(false)}
        >
          <img src={docentStopImg} alt="" className={styles.stopIcon} />
        </button>
      </div>
    </div>
  )
}
