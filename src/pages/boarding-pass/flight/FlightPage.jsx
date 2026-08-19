import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import { completeBoardingPass, getLatestBoardingPass } from '@/shared/api/boardingPassApi.js'
import { getFloors } from '@/shared/api/floorApi.js'
import cameraDotImg from '@/shared/assets/boarding-pass/flight/camera-dot.svg'
import controlArrowImg from '@/shared/assets/boarding-pass/flight/control-arrow.svg'
import controlBrightnessImg from '@/shared/assets/boarding-pass/flight/control-brightness.svg'
import controlPowerImg from '@/shared/assets/boarding-pass/flight/control-power.svg'
import controlSoundImg from '@/shared/assets/boarding-pass/flight/control-sound.svg'
import decoRightImg from '@/shared/assets/boarding-pass/flight/deco-right.png'
import hingeImg from '@/shared/assets/boarding-pass/flight/hinge.svg'
import mapImg from '@/shared/assets/boarding-pass/flight/map.png'
import planeMarkerImg from '@/shared/assets/boarding-pass/flight/plane-marker.svg'
import routePathImg from '@/shared/assets/boarding-pass/flight/route-path.svg'
import tabletLogoImg from '@/shared/assets/boarding-pass/flight/tablet-logo.png'
import ticketSheetBack from '@/shared/assets/boarding-pass/flight/ticket-sheet-back.png'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import BoardingPassStageBackdrop from '@/shared/layout/BoardingPassStageBackdrop.jsx'
import BoardingPassStageHeader from '@/shared/layout/BoardingPassStageHeader.jsx'
import BoardingPassStepNav from '@/shared/layout/BoardingPassStepNav.jsx'
import { FLIGHT_STEP, guideFloorFromStep } from '@/shared/layout/boardingPassSteps.js'
import { useToast } from '@/shared/ui/toastContext.js'

import styles from './FlightPage.module.scss'

/**
 * 비행 MAPS 페이지 (41)(43) + 티켓 시트 (42).
 * 여행 가이드 → /boarding-pass/guide.
 * 음성 도슨트 = 비행 인트로 해설(GET /floors의 introAudioUrl).
 */
export function Component() {
  const navigate = useNavigate()
  const [pass, setPass] = useState(null)
  const [passStatus, setPassStatus] = useState('loading')
  const [ticketOpen, setTicketOpen] = useState(false)
  const [ending, setEnding] = useState(false)
  const { showToast } = useToast()

  // 비행 종료 — 방문이 확정되어 여권 스탬프가 생긴다. 바로 여권으로 보내
  // 찍힌 스탬프를 보여 준다.
  async function handleEndFlight() {
    if (ending) return
    const passId = pass?.boardingPassId
    if (!passId) {
      navigate('/boarding-pass')
      return
    }

    setEnding(true)
    try {
      await completeBoardingPass(passId)
      navigate('/boarding-pass/passport')
    } catch (cause) {
      // 이미 종료된 패스 등 사유를 백엔드가 담아 준다. 그대로 알린다.
      showToast(
        <div className="pr-7">
          <p className="text-sm leading-5">{cause?.message ?? '비행을 종료하지 못했습니다.'}</p>
          <p className="mt-1 text-xs text-[#c07346]">잠시 후 다시 시도해 주세요</p>
        </div>,
        { position: 'center' },
      )
      setEnding(false)
    }
  }
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
    if (event.target.closest?.('button, a, input, select, textarea')) return
    event.preventDefault()
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

  // 비행 무대의 도슨트 음성. 실패해도 화면은 그대로다 — 도슨트만 목으로 남는다.
  const [introAudioUrl, setIntroAudioUrl] = useState(null)
  useEffect(() => {
    let alive = true
    getFloors()
      .then(({ introAudioUrl: url }) => {
        if (alive) setIntroAudioUrl(url ?? null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getLatestBoardingPass()
      .then((data) => {
        if (cancelled) return
        setPass(data)
        setPassStatus(data ? 'ready' : 'empty')
      })
      .catch(() => {
        if (cancelled) return
        setPass(null)
        setPassStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function goToStep(step) {
    const floor = guideFloorFromStep(step)
    if (!floor) return
    navigate('/boarding-pass/guide', { state: { floor } })
  }

  const mapDate = formatMapDate()

  return (
    <div className={styles.page}>
      <StoreHeader />

      <div className={styles.stage}>
        <BoardingPassStageBackdrop />

        <main className={styles.main}>
          <BoardingPassStageHeader
            title="MAPS"
            closeLabel="닫기"
            onClose={() => navigate('/boarding-pass/scan')}
            audioUrl={introAudioUrl}
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
                onClick={handleEndFlight}
                disabled={ending}
                className={styles.actionBtn}
              >
                <span className={styles.actionBtnLabel}>{ending ? '종료 중…' : '비행 종료'}</span>
              </button>
            </div>
            <p className={styles.passportHint}>
              비행 종료 후 여행의 기록이 담긴 Passport가 발급됩니다
            </p>
          </div>
        </main>

        <BoardingPassStepNav
          step={FLIGHT_STEP}
          onPrev={() => navigate('/boarding-pass/scan')}
          onNext={() => navigate('/boarding-pass/guide')}
          onSelectStep={goToStep}
          prevDisabled
          groupLabel="여행 진행"
        />
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
          onPointerDown={onSheetPointerDown}
          onPointerMove={onSheetPointerMove}
          onPointerUp={onSheetPointerEnd}
          onPointerCancel={onSheetPointerEnd}
        >
          <img src={ticketSheetBack} alt="" aria-hidden="true" className={styles.sheetBack} />
          <div className={styles.sheetGrab} aria-hidden="true">
            <div className={styles.handle} />
            <p className={styles.sheetTitle}>TICKET</p>
          </div>
          {pass ? (
            <BoardingTicketCard pass={pass} size="md" className={styles.ticketSlot} />
          ) : (
            <div className={styles.ticketLoading}>
              <p>
                {passStatus === 'error'
                  ? '티켓을 불러오지 못했습니다.'
                  : passStatus === 'empty'
                    ? '발급된 보딩패스를 찾을 수 없습니다.'
                    : '티켓을 불러오는 중…'}
              </p>
              {passStatus === 'empty' || passStatus === 'error' ? (
                <button
                  type="button"
                  className={styles.ticketEmptyCta}
                  onClick={() => navigate('/boarding-pass')}
                >
                  발급 페이지로 이동
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatMapDate(now = new Date()) {
  const day = String(now.getDate()).padStart(2, '0')
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${day} ${month} ${now.getFullYear()}`
}
