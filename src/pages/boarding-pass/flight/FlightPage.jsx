import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import { useBagHandlers } from '@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx'
import { getCurrentBoardingPass } from '@/shared/api/boardingPassApi.js'
import cameraDotImg from '@/shared/assets/boarding-pass/flight/camera-dot.svg'
import cloudLargeImg from '@/shared/assets/boarding-pass/flight/cloud-large.png'
import controlBrightnessImg from '@/shared/assets/boarding-pass/flight/control-brightness.svg'
import controlPowerImg from '@/shared/assets/boarding-pass/flight/control-power.svg'
import controlSoundImg from '@/shared/assets/boarding-pass/flight/control-sound.svg'
import decoRightImg from '@/shared/assets/boarding-pass/flight/deco-right.png'
import docentPlayImg from '@/shared/assets/boarding-pass/flight/docent-play.svg'
import docentStopImg from '@/shared/assets/boarding-pass/flight/docent-stop.svg'
import hingeScrewImg from '@/shared/assets/boarding-pass/flight/hinge-screw.svg'
import mapImg from '@/shared/assets/boarding-pass/flight/map.png'
import navNextImg from '@/shared/assets/boarding-pass/flight/nav-next.svg'
import navPrevImg from '@/shared/assets/boarding-pass/flight/nav-prev.svg'
import planeDecoImg from '@/shared/assets/boarding-pass/flight/plane-deco.png'
import planeMarkerImg from '@/shared/assets/boarding-pass/flight/plane-marker.svg'
import routePathImg from '@/shared/assets/boarding-pass/flight/route-path.svg'
import tabletLogoImg from '@/shared/assets/boarding-pass/flight/tablet-logo.png'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'
import DeferredButton from '@/shared/ui/DeferredButton.jsx'

import styles from './FlightPage.module.scss'

/**
 * 비행 MAPS 페이지 (41)(43) + 티켓 시트 (42).
 * 비행 종료 = D-02 DeferredButton. 여행 가이드 → /boarding-pass/guide.
 * 음성 도슨트 = M-01 mock (재생/정지 토글만).
 */
function FlightPage() {
  const navigate = useNavigate()
  const bagHandlers = useBagHandlers()
  const [pass, setPass] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [docentPlaying, setDocentPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCurrentBoardingPass()
      .then((data) => {
        if (!cancelled) setPass(data)
      })
      .catch(() => {
        if (!cancelled) setPass(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const mapDate = formatMapDate(pass)

  return (
    <div className={styles.page}>
      <BoardingPassChrome {...bagHandlers} />

      <div aria-hidden="true" className={styles.ambiance}>
        <img src={cloudLargeImg} alt="" className={styles.cloudTop} />
        <img src={cloudLargeImg} alt="" className={styles.cloudBottom} />
        <img src={planeDecoImg} alt="" className={styles.planeDeco} />
        <img src={decoRightImg} alt="" className={styles.chestAmbientA} />
        <img src={decoRightImg} alt="" className={styles.chestAmbientB} />
        <img src={decoRightImg} alt="" className={styles.chestAmbientC} />
        <div className={styles.footerFade} />
      </div>

      <main className={styles.main}>
        <div className={styles.topRow}>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => navigate('/boarding-pass/scan')}
            className={styles.close}
          >
            <img src={closeIcon} alt="" className={styles.closeImg} />
          </button>

          <div className={styles.docentBlock}>
            <p className={styles.docentHint}>음성 AI 도슨트가 고객님의 여정을 안내합니다</p>
            <div className={styles.docentControls} data-deferred-id="M-01">
              <button
                type="button"
                aria-label="도슨트 재생"
                aria-pressed={docentPlaying}
                className={styles.playBtn}
                onClick={() => setDocentPlaying(true)}
              >
                <span aria-hidden="true" className={styles.playFill} />
                <img src={docentPlayImg} alt="" className={styles.playIcon} />
              </button>
              <button
                type="button"
                aria-label="도슨트 정지"
                aria-pressed={!docentPlaying}
                className={styles.stopBtn}
                onClick={() => setDocentPlaying(false)}
              >
                <img src={docentStopImg} alt="" className={styles.stopIcon} />
              </button>
            </div>
          </div>
        </div>

        <h2 className={styles.title}>MAPS</h2>

        <div className={styles.monitorWrap}>
          <div className={styles.monitor}>
            <img src={cameraDotImg} alt="" aria-hidden="true" className={styles.camera} />

            <div className={styles.bezel}>
              <div className={styles.screen}>
                <img src={mapImg} alt="서울에서 뮌헨으로 가는 항로 지도" className={styles.mapImg} />
                <div className={styles.overlay}>
                  <p className={styles.date}>{mapDate}</p>
                  <div className={styles.routeRow}>
                    <span className={styles.city}>SEOUL</span>
                    <div className={styles.routeTrack}>
                      <img src={routePathImg} alt="" className={styles.routePath} />
                      <img src={planeMarkerImg} alt="" className={styles.planeMarker} />
                    </div>
                    <span className={styles.city}>MUNICH</span>
                  </div>
                </div>
              </div>

              <div className={styles.controlBar} aria-hidden="true">
                <div className={styles.controlSlot}>
                  <img src={controlBrightnessImg} alt="" className={styles.controlIcon} />
                </div>
                <div className={styles.controlSlot}>
                  <img src={controlPowerImg} alt="" className={styles.controlIcon} />
                </div>
                <div className={styles.controlSlot}>
                  <img src={controlSoundImg} alt="" className={styles.controlIcon} />
                </div>
              </div>
            </div>

            <img src={tabletLogoImg} alt="" aria-hidden="true" className={styles.tabletLogo} />

            <div className={styles.hinge} aria-hidden="true">
              <div className={styles.hingeBar} />
              <img src={hingeScrewImg} alt="" className={styles.hingeScrew} />
              <img
                src={hingeScrewImg}
                alt=""
                className={`${styles.hingeScrew} ${styles.hingeScrewFlip}`}
              />
            </div>
          </div>

          <img src={decoRightImg} alt="" aria-hidden="true" className={styles.trunk} />
        </div>

        <div className={styles.actions}>
          <div className={styles.actionRow}>
            <button type="button" onClick={() => setTicketOpen(true)} className={styles.actionBtn}>
              티켓 정보
            </button>
            <button
              type="button"
              onClick={() => navigate('/boarding-pass/guide')}
              className={styles.actionBtn}
            >
              여행 가이드
            </button>
            <DeferredButton deferredId="D-02" className={styles.actionBtn}>
              비행 종료
            </DeferredButton>
          </div>
          <p className={styles.passportHint}>
            비행 종료 후 여행의 기록이 담긴 Passport가 발급됩니다
          </p>
        </div>

        <div className={styles.playback} role="group" aria-label="비행 진행">
          <button type="button" aria-label="이전" className={styles.navBtn}>
            <img src={navPrevImg} alt="" className={styles.navIcon} />
          </button>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} />
          </div>
          <button type="button" aria-label="다음" className={styles.navBtn}>
            <img src={navNextImg} alt="" className={styles.navIcon} />
          </button>
        </div>
      </main>

      {ticketOpen ? (
        <div className={styles.sheetRoot}>
          <button
            type="button"
            aria-label="티켓 시트 닫기"
            className={styles.sheetScrim}
            onClick={() => setTicketOpen(false)}
          />
          <div role="dialog" aria-label="티켓 정보" className={styles.sheet}>
            <div className={styles.handle} />
            <p className={styles.sheetTitle}>TICKET</p>
            {pass ? (
              <BoardingTicketCard pass={pass} size="md" className={styles.ticketSlot} />
            ) : (
              <p className={styles.ticketLoading}>티켓을 불러오는 중…</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatMapDate(pass) {
  if (pass?.boardingLabel) {
    const match = String(pass.boardingLabel).match(/\d{1,2}\s+[A-Z]{3}\s+\d{4}/i)
    if (match) return match[0].toUpperCase()
  }
  return '25 AUG 2026'
}

export default FlightPage
