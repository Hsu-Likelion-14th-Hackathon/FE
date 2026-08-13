import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import { getCurrentBoardingPass } from '@/shared/api/boardingPassApi.js'
import cameraDotImg from '@/shared/assets/boarding-pass/flight/camera-dot.svg'
import controlArrowImg from '@/shared/assets/boarding-pass/flight/control-arrow.svg'
import controlBrightnessImg from '@/shared/assets/boarding-pass/flight/control-brightness.svg'
import controlPowerImg from '@/shared/assets/boarding-pass/flight/control-power.svg'
import controlSoundImg from '@/shared/assets/boarding-pass/flight/control-sound.svg'
import decoRightImg from '@/shared/assets/boarding-pass/flight/deco-right.png'
import hingeImg from '@/shared/assets/boarding-pass/flight/hinge.svg'
import mapImg from '@/shared/assets/boarding-pass/flight/map.png'
import navNextImg from '@/shared/assets/boarding-pass/flight/nav-next.svg'
import navPrevImg from '@/shared/assets/boarding-pass/flight/nav-prev.svg'
import planeMarkerImg from '@/shared/assets/boarding-pass/flight/plane-marker.svg'
import routePathImg from '@/shared/assets/boarding-pass/flight/route-path.svg'
import tabletLogoImg from '@/shared/assets/boarding-pass/flight/tablet-logo.png'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'
import BoardingPassStageBackdrop from '@/shared/layout/BoardingPassStageBackdrop.jsx'
import BoardingPassStageHeader from '@/shared/layout/BoardingPassStageHeader.jsx'

import styles from './FlightPage.module.scss'

/**
 * 비행 MAPS 페이지 (41)(43) + 티켓 시트 (42).
 * 여행 가이드 → /boarding-pass/guide.
 * 음성 도슨트 = M-01 mock (재생/정지 토글만).
 */
export function Component() {
  const navigate = useNavigate()
  const [pass, setPass] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const sheetRef = useRef(null)
  const dragRef = useRef({ pointerId: null, startY: 0, startAt: 0, dy: 0 })

  function setSheetDrag(dy, dragging) {
    const sheet = sheetRef.current
    if (!sheet) return
    sheet.style.setProperty('--sheet-drag', `${Math.max(0, dy)}px`)
    sheet.dataset.dragging = dragging ? 'true' : 'false'
  }

  function openTicketSheet() {
    setSheetDrag(0, false)
    setTicketOpen(true)
  }

  function onSheetPointerDown(event) {
    if (!ticketOpen || !event.isPrimary || event.button !== 0) return
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startAt: performance.now(),
      dy: 0,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setSheetDrag(0, true)
  }

  function onSheetPointerMove(event) {
    const drag = dragRef.current
    if (drag.pointerId !== event.pointerId) return
    const dy = Math.max(0, event.clientY - drag.startY)
    drag.dy = dy
    setSheetDrag(dy, true)
  }

  function onSheetPointerEnd(event) {
    const drag = dragRef.current
    if (drag.pointerId !== event.pointerId) return
    const dy = drag.dy
    const elapsed = Math.max(performance.now() - drag.startAt, 1)
    const velocity = dy / elapsed
    const height = sheetRef.current?.offsetHeight ?? 1
    drag.pointerId = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)

    const shouldClose = dy > 72 || dy > height * 0.22 || velocity > 0.55
    setSheetDrag(shouldClose ? dy : 0, false)
    if (shouldClose) setTicketOpen(false)
  }

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

  const mapDate = formatMapDate()

  return (
    <div className={styles.page}>
      <BoardingPassChrome />

      <div className={styles.stage}>
        <BoardingPassStageBackdrop />

        <main className={styles.main}>
        <BoardingPassStageHeader
          title="MAPS"
          closeLabel="닫기"
          onClose={() => navigate('/boarding-pass/scan')}
        />

        <div className={styles.monitorWrap}>
          <div className={styles.monitor}>
            <img src={cameraDotImg} alt="" aria-hidden="true" className={styles.camera} />

            <div className={styles.bezel}>
              <div className={styles.screen}>
                <img
                  src={mapImg}
                  alt="서울에서 뮌헨으로 가는 항로 지도"
                  className={styles.mapImg}
                />
                <div className={styles.overlay}>
                  <p className={styles.date}>{mapDate}</p>
                  <div className={styles.routeRow}>
                    <span className={styles.city}>SEOUL</span>
                    <div className={styles.routeTrack}>
                      <img src={routePathImg} alt="" className={styles.routePath} />
                      <img
                        src={planeMarkerImg}
                        alt=""
                        className={styles.planeMarker}
                        data-testid="plane-marker"
                      />
                    </div>
                    <span className={styles.city}>MUNICH</span>
                  </div>
                </div>
              </div>

              <div className={styles.controlBar} aria-hidden="true">
                <div className={styles.controlSlot}>
                  <img
                    src={controlArrowImg}
                    alt=""
                    className={`${styles.controlArrow} ${styles.controlArrowDown}`}
                  />
                  <img src={controlBrightnessImg} alt="" className={styles.controlIcon} />
                  <img src={controlArrowImg} alt="" className={styles.controlArrow} />
                </div>
                <div className={styles.controlSlot}>
                  <img src={controlPowerImg} alt="" className={styles.controlIcon} />
                </div>
                <div className={styles.controlSlot}>
                  <img
                    src={controlArrowImg}
                    alt=""
                    className={`${styles.controlArrow} ${styles.controlArrowDown}`}
                  />
                  <img src={controlSoundImg} alt="" className={styles.controlIcon} />
                  <img src={controlArrowImg} alt="" className={styles.controlArrow} />
                </div>
              </div>
            </div>

            <img src={tabletLogoImg} alt="" aria-hidden="true" className={styles.tabletLogo} />

            <img src={hingeImg} alt="" aria-hidden="true" className={styles.hinge} />
          </div>

          <img src={decoRightImg} alt="" aria-hidden="true" className={styles.trunk} />
        </div>

        <div className={styles.actions}>
          <div className={styles.actionRow}>
            <button type="button" onClick={openTicketSheet} className={styles.actionBtn}>
              <span className={styles.actionBtnLabel}>티켓 정보</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/boarding-pass/guide')}
              className={styles.actionBtn}
            >
              <span className={styles.actionBtnLabel}>여행 가이드</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/boarding-pass')}
              className={styles.actionBtn}
            >
              <span className={styles.actionBtnLabel}>비행 종료</span>
            </button>
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
          <button
            type="button"
            aria-label="다음"
            className={styles.navBtn}
            onClick={() => navigate('/boarding-pass/guide')}
          >
            <img src={navNextImg} alt="" className={styles.navIcon} />
          </button>
        </div>
      </main>
      </div>

      <div
        className={styles.sheetRoot}
        data-state={ticketOpen ? 'open' : 'closed'}
        aria-hidden={!ticketOpen}
      >
        <button
          type="button"
          aria-label="티켓 시트 닫기"
          className={styles.sheetScrim}
          onClick={() => setTicketOpen(false)}
          tabIndex={ticketOpen ? 0 : -1}
        />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal={ticketOpen}
          aria-label="티켓 정보"
          className={styles.sheet}
        >
          <div
            className={styles.sheetGrab}
            aria-label="아래로 밀어 닫기"
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerEnd}
            onPointerCancel={onSheetPointerEnd}
          >
            <div className={styles.handle} />
            <p className={styles.sheetTitle}>TICKET</p>
          </div>
            {pass ? (
              <BoardingTicketCard pass={pass} size="md" className={styles.ticketSlot} />
            ) : (
              <p className={styles.ticketLoading}>티켓을 불러오는 중…</p>
            )}
          </div>
        </div>
    </div>
  )
}

function formatMapDate() {
  const now = new Date()
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]
  const day = String(now.getDate()).padStart(2, '0')
  return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`
}
