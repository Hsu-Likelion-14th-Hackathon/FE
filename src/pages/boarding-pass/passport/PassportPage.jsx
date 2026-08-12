import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import { useBagHandlers } from '@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import navNext from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrev from '@/shared/assets/boarding-pass/guide/nav-prev.svg'
import journeyDecoration from '@/shared/assets/boarding-pass/passport/journey-decoration.png'
import mcmHaus from '@/shared/assets/boarding-pass/passport/mcm-haus.png'
import passportCover from '@/shared/assets/boarding-pass/passport/passport-cover.png'
import passportSpread from '@/shared/assets/boarding-pass/passport/passport-spread.png'
import passportStampsImage from '@/shared/assets/boarding-pass/passport/passport-stamps.png'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'

import { journeyRecords, passportProfile, passportStamps, passportTicket } from './passportData.js'
import styles from './PassportPage.module.scss'

const sheetLabels = {
  history: '여행 기록',
  'history-detail': '1F JOURNEY 상세',
  ticket: '탑승권',
}

export function Component() {
  const navigate = useNavigate()
  const bagHandlers = useBagHandlers()
  const [step, setStep] = useState(0)
  const [sheet, setSheet] = useState(null)
  const dialogRef = useRef(null)
  const sheetTriggerRef = useRef(null)
  const progress = (step + 1) * 25
  const moveStep = (delta) => setStep((current) => Math.min(3, Math.max(0, current + delta)))

  const openSheet = (nextSheet, trigger) => {
    if (!sheet) sheetTriggerRef.current = trigger
    setSheet(nextSheet)
  }
  const closeSheet = () => {
    setSheet(null)
    requestAnimationFrame(() => sheetTriggerRef.current?.focus())
  }
  const handleStepKeyDown = (event, delta) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      moveStep(delta)
    }
  }

  useEffect(() => {
    if (!sheet) return undefined
    const dialog = dialogRef.current
    const initialFocus = dialog?.querySelector('button') ?? dialog
    initialFocus?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeSheet()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sheet])

  return (
    <div className={styles.page}>
      <BoardingPassChrome {...bagHandlers} />
      <section className={styles.stage} aria-labelledby="passport-title">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => (sheet ? closeSheet() : navigate('/boarding-pass'))}
          className={styles.close}
        >
          <img src={closeIcon} alt="" />
        </button>
        <div className={styles.content} inert={sheet || undefined}>
          <h2 id="passport-title" className={styles.srOnly}>
            MCM PASSPORT
          </h2>
          <PassportSpread
            step={step}
            onProducts={() => navigate('/products')}
            onHistory={(event) => openSheet('history', event.currentTarget)}
          />
          <div
            role="progressbar"
            aria-label="여권 진행률"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
            className={styles.progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <nav className={styles.navigation} aria-label="여권 단계 이동">
            <button
              type="button"
              aria-label="이전 단계"
              disabled={step === 0}
              onClick={() => moveStep(-1)}
              onKeyDown={(event) => handleStepKeyDown(event, -1)}
            >
              <img src={navPrev} alt="" />
            </button>
            <button
              type="button"
              aria-label="다음 단계"
              disabled={step === 3}
              onClick={() => moveStep(1)}
              onKeyDown={(event) => handleStepKeyDown(event, 1)}
            >
              <img src={navNext} alt="" />
            </button>
          </nav>
        </div>
        {sheet ? (
          <div className={styles.sheetRoot}>
            <button
              type="button"
              aria-label="시트 배경 닫기"
              className={styles.scrim}
              onClick={closeSheet}
            />
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={sheetLabels[sheet]}
              tabIndex="-1"
              className={styles.sheet}
            >
              {sheet === 'history' ? (
                <HistoryList
                  onSelectJourney={(event) => openSheet('history-detail', event.currentTarget)}
                />
              ) : null}
              {sheet === 'history-detail' ? (
                <JourneyDetail onTicket={(event) => openSheet('ticket', event.currentTarget)} />
              ) : null}
              {sheet === 'ticket' ? <BoardingTicketCard pass={passportTicket} size="md" /> : null}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function PassportSpread({ step, onProducts, onHistory }) {
  if (step === 0) {
    return (
      <section className={styles.passport} aria-label="여권 표지">
        <img src={passportCover} alt="" className={styles.passportImage} />
        <p className={styles.coverTitle}>MCM PASSPORT</p>
      </section>
    )
  }

  if (step === 1) {
    return (
      <section className={styles.passport} aria-label="여권 프로필">
        <img src={passportSpread} alt="" className={styles.passportImage} />
        <div className={styles.profile}>
          <img src={mcmHaus} alt="MCM HAUS 매장 사진" className={styles.haus} />
          <p>{passportProfile.passportNumber}</p>
          <p>
            {passportProfile.surname} / {passportProfile.givenName}
          </p>
          <p>{passportProfile.nationality}</p>
          <p>{passportProfile.issueDate}</p>
          <p>CREDIT {passportProfile.credit}</p>
        </div>
      </section>
    )
  }

  if (step === 2) {
    return (
      <section className={styles.passport} aria-label="여권 방문 스탬프">
        <img src={passportStampsImage} alt="" className={styles.passportImage} />
        <div className={styles.stamps}>
          <p>총 방문 횟수 {passportProfile.visits}회</p>
          <ul>
            {passportStamps.map((stamp) => (
              <li key={stamp.id}>
                <strong>{stamp.floor}</strong> {stamp.date}
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.passport} aria-label="여권 여행 기록">
      <img src={journeyDecoration} alt="" className={styles.journeyDecoration} />
      <div className={styles.journeys}>
        {journeyRecords.map((record) => (
          <p key={record.id}>
            <span>{record.floor}</span>
            <strong>{record.title}</strong>
            <time>{record.date}</time>
          </p>
        ))}
        <button type="button" onClick={onHistory} className={styles.history}>
          여행 기록 보기
        </button>
        <button type="button" onClick={onProducts} className={styles.products}>
          상품 보러가기
        </button>
      </div>
    </section>
  )
}

function HistoryList({ onSelectJourney }) {
  return (
    <>
      <p className={styles.sheetEyebrow}>TRAVEL HISTORY</p>
      <h3 className={styles.sheetTitle}>여행 기록</h3>
      <div className={styles.historyList}>
        {journeyRecords.map((record) =>
          record.id === 'journey' ? (
            <button
              key={record.id}
              type="button"
              aria-label="1F JOURNEY 상세 보기"
              className={styles.historyCard}
              onClick={onSelectJourney}
            >
              <JourneyCard record={record} />
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <article key={record.id} className={styles.historyCard}>
              <JourneyCard record={record} />
            </article>
          ),
        )}
      </div>
    </>
  )
}

function JourneyDetail({ onTicket }) {
  const journey = journeyRecords[0]
  return (
    <>
      <p className={styles.sheetEyebrow}>{journey.floor}</p>
      <h3 className={styles.sheetTitle}>{journey.title}</h3>
      <p className={styles.detailDate}>{journey.date}</p>
      <button type="button" className={styles.ticketButton} onClick={onTicket}>
        티켓 보기
      </button>
    </>
  )
}

function JourneyCard({ record }) {
  return (
    <span className={styles.journeyCardContent}>
      <span>{record.floor}</span>
      <strong>{record.title}</strong>
      <time>{record.date}</time>
    </span>
  )
}
