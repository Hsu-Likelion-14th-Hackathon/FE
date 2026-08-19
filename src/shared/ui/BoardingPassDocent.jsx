import { useEffect, useRef, useState } from 'react'

import docentPauseImg from '@/shared/assets/boarding-pass/flight/docent-pause.svg'
import docentPlayImg from '@/shared/assets/boarding-pass/flight/docent-play.svg'
import docentStopImg from '@/shared/assets/boarding-pass/flight/docent-stop.svg'

import styles from './BoardingPassDocent.module.scss'

/** 해설 재생 속도. 눌러서 순환한다 — 목록 끝이면 처음으로. */
const PLAYBACK_RATES = [1, 1.25, 1.5, 2]

const DOCENT_HINT = '음성 AI 도슨트가 고객님의 여정을 안내합니다'

/**
 * 안내 문구 파도타기 — 화면에 들어설 때 글자가 한 자씩 살짝 떠올랐다
 * 내려온다. 한 번만 돈다(반복하면 읽는 내내 흔들리는 문장이 된다).
 * 글자를 쪼개므로 읽어 주는 문장은 aria-label로 온전히 남긴다.
 */
function DocentHintWave() {
  return (
    <p className={styles.docentHint} aria-label={DOCENT_HINT}>
      {[...DOCENT_HINT].map((ch, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={styles.hintChar}
          style={{ animationDelay: `${index * 0.04}s` }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </p>
  )
}

/**
 * 음성 AI 도슨트 (M-01).
 *
 * 층 조회(GET /floors)의 audioUrl을 받아 재생한다. 층이 바뀌면 이전 층
 * 해설을 멈추고 갈아끼운다 — 남겨 두면 두 층의 음성이 겹친다. 배속은 층을
 * 옮겨도 유지한다 — 듣는 속도는 층이 아니라 사람의 취향이다.
 *
 * 조작은 실제 플레이어처럼:
 *   - 재생 버튼: 재생 ⇄ 일시정지 토글. 멈춘 지점을 기억했다 이어 튼다.
 *   - 네모 버튼: 처음부터 다시 튼다.
 *
 * audioUrl이 없으면(아직 음성이 등록되지 않은 화면) 재생/정지 상태만
 * 표현하는 기존 목 동작으로 남는다. 디자인에 있는 버튼이라 감추지 않는다.
 */
export default function BoardingPassDocent({ audioUrl = null }) {
  const [playing, setPlaying] = useState(false)
  const [rateIndex, setRateIndex] = useState(0)
  const audioRef = useRef(null)

  // 층이 바뀌면 정지 상태부터 시작한다. 효과에서 바꾸면 렌더가 한 번 더
  // 돌므로 렌더 중에 보정한다(React의 파생 상태 조정 패턴).
  const [lastUrl, setLastUrl] = useState(audioUrl)
  if (lastUrl !== audioUrl) {
    setLastUrl(audioUrl)
    setPlaying(false)
  }

  const rate = PLAYBACK_RATES[rateIndex]

  useEffect(() => {
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

  const startPlayback = (audio) => {
    audio.playbackRate = rate
    setPlaying(true)
    // 재생 실패(네트워크·정책)는 조용히 정지 상태로 되돌린다 — 여기서
    // 막혀도 가이드 본문은 그대로 읽을 수 있다.
    audio.play().catch(() => setPlaying(false))
  }

  /** 재생 ⇄ 일시정지. pause는 currentTime을 건드리지 않아 지점이 남는다. */
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) {
      setPlaying((current) => !current)
      return
    }
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    startPlayback(audio)
  }

  /** 처음부터 다시 튼다. */
  const restart = () => {
    const audio = audioRef.current
    if (!audio) {
      setPlaying(false)
      return
    }
    audio.currentTime = 0
    startPlayback(audio)
  }

  const cycleRate = () => {
    const next = (rateIndex + 1) % PLAYBACK_RATES.length
    setRateIndex(next)
    // 재생 중이면 그 자리에서 바로 빨라진다.
    if (audioRef.current) audioRef.current.playbackRate = PLAYBACK_RATES[next]
  }

  return (
    <div className={styles.docentBlock}>
      {/* 층을 옮기면(audioUrl 변경) 리마운트되어 파도가 다시 지나간다.
          같은 화면 안에서는 한 번만 돈다. */}
      <DocentHintWave key={audioUrl ?? 'static'} />
      <div className={styles.docentControls} data-deferred-id="M-01">
        <button
          type="button"
          aria-label={`재생 속도 ${rate}배`}
          className={styles.rateBtn}
          onClick={cycleRate}
        >
          {rate}x
        </button>
        <button
          type="button"
          aria-label={playing ? '도슨트 일시정지' : '도슨트 재생'}
          aria-pressed={playing}
          className={styles.playBtn}
          onClick={togglePlay}
        >
          {/* 일시정지 아이콘은 정지 아이콘과 같은 문법(흰 원판 + 브라운 구멍)
              이라 채움이 제 안에 있다. 재생 삼각형만 뒤판(playFill)이 필요하다. */}
          {playing ? (
            <img src={docentPauseImg} alt="" className={styles.playIcon} />
          ) : (
            <>
              <span aria-hidden="true" className={styles.playFill} />
              <img src={docentPlayImg} alt="" className={styles.playIcon} />
            </>
          )}
        </button>
        <button
          type="button"
          aria-label="도슨트 처음부터 재생"
          className={styles.stopBtn}
          onClick={restart}
        >
          <img src={docentStopImg} alt="" className={styles.stopIcon} />
        </button>
      </div>
    </div>
  )
}
