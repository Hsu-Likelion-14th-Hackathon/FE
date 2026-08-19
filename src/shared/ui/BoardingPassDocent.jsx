import { useEffect, useRef, useState } from 'react'

import docentPlayImg from '@/shared/assets/boarding-pass/flight/docent-play.svg'
import docentStopImg from '@/shared/assets/boarding-pass/flight/docent-stop.svg'

import styles from './BoardingPassDocent.module.scss'

/**
 * 음성 AI 도슨트 (M-01).
 *
 * 층 조회(GET /floors)의 audioUrl을 받아 재생한다. 층이 바뀌면 이전 층
 * 해설을 멈추고 갈아끼운다 — 남겨 두면 두 층의 음성이 겹친다.
 *
 * audioUrl이 없으면(아직 음성이 등록되지 않은 화면) 재생/정지 상태만
 * 표현하는 기존 목 동작으로 남는다. 디자인에 있는 버튼이라 감추지 않는다.
 */
export default function BoardingPassDocent({ audioUrl = null }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    setPlaying(false)
    if (!audioUrl) {
      audioRef.current = null
      return undefined
    }

    const audio = new Audio(audioUrl)
    // 눌러야 트는 해설이다. 미리 받아 두면 층을 훑기만 해도 MP3를 내려받는다.
    audio.preload = 'none'
    const onEnded = () => setPlaying(false)
    audio.addEventListener('ended', onEnded)
    audioRef.current = audio

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
    }
  }, [audioUrl])

  const play = () => {
    setPlaying(true)
    // 재생 실패(네트워크·정책)는 조용히 정지 상태로 되돌린다 — 여기서
    // 막혀도 가이드 본문은 그대로 읽을 수 있다.
    audioRef.current?.play().catch(() => setPlaying(false))
  }

  const stop = () => {
    setPlaying(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  return (
    <div className={styles.docentBlock}>
      <p className={styles.docentHint}>음성 AI 도슨트가 고객님의 여정을 안내합니다</p>
      <div className={styles.docentControls} data-deferred-id="M-01">
        <button
          type="button"
          aria-label="도슨트 재생"
          aria-pressed={playing}
          className={styles.playBtn}
          onClick={play}
        >
          <span aria-hidden="true" className={styles.playFill} />
          <img src={docentPlayImg} alt="" className={styles.playIcon} />
        </button>
        <button
          type="button"
          aria-label="도슨트 정지"
          aria-pressed={!playing}
          className={styles.stopBtn}
          onClick={stop}
        >
          <img src={docentStopImg} alt="" className={styles.stopIcon} />
        </button>
      </div>
    </div>
  )
}
