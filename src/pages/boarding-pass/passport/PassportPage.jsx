import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import { useBagHandlers } from '@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import navNext from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrev from '@/shared/assets/boarding-pass/guide/nav-prev.svg'
import stageBack from '@/shared/assets/boarding-pass/landing/stage-back.svg'
import journeyDecoration from '@/shared/assets/boarding-pass/passport/journey-decoration.png'
import journeyTicket from '@/shared/assets/boarding-pass/passport/journey-ticket.png'
import journeyTicketMark from '@/shared/assets/boarding-pass/passport/journey-ticket-mark.png'
import mcmHaus from '@/shared/assets/boarding-pass/passport/mcm-haus.png'
import bowLeft from '@/shared/assets/boarding-pass/passport/passport-bow-left.png'
import bowRight from '@/shared/assets/boarding-pass/passport/passport-bow-right.png'
import coverMcm from '@/shared/assets/boarding-pass/passport/cover-mcm.png'
import coverPassport from '@/shared/assets/boarding-pass/passport/cover-passport.png'
import coverStar from '@/shared/assets/boarding-pass/passport/cover-star.png'
import passportCover from '@/shared/assets/boarding-pass/passport/passport-cover.png'
import passportEmblem from '@/shared/assets/boarding-pass/passport/passport-emblem.png'
import passportSpread from '@/shared/assets/boarding-pass/passport/passport-spread.png'
import passportStamp from '@/shared/assets/boarding-pass/passport/passport-stamp.png'
import passportStampBow from '@/shared/assets/boarding-pass/passport/passport-stamp-bow.png'
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
    dialog.scrollTop = 0
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
      <div inert={sheet || undefined} className={sheet ? styles.dimmed : undefined}>
        <BoardingPassChrome {...bagHandlers} />
      </div>
      <section className={styles.stage} aria-labelledby="passport-title">
        <img src={stageBack} alt="" aria-hidden="true" className={styles.stageBack} />
        <div className={styles.footerFade} aria-hidden="true" />
        <button
          type="button"
          aria-label="닫기"
          onClick={() => (sheet ? closeSheet() : navigate('/boarding-pass'))}
          className={styles.close}
        >
          <img src={closeIcon} alt="" />
        </button>
        <div
          className={`${styles.content} ${sheet ? styles.dimmed : ''}`}
          inert={sheet || undefined}
        >
          <h2 id="passport-title" className={styles.srOnly}>
            MCM PASSPORT
          </h2>
          <div className={styles.introCopy}>
            <p>MCM BOARDING PASS</p>
            <strong>당신의 MCM 비행에 완벽한 맞춤형 동선을 추천합니다</strong>
            <span>이 행사는 MCM HAUS 매장 기반으로 진행됩니다</span>
          </div>
          <PassportSpread
            step={step}
            onHistory={(event) => openSheet('history', event.currentTarget)}
            onTicket={(event) => openSheet('ticket', event.currentTarget)}
            onProducts={() => navigate('/products')}
          />
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
            <div
              role="progressbar"
              aria-label="여권 진행률"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
              aria-valuetext={`${step + 1}단계 / 4단계`}
              className={styles.progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
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
              className={`${styles.sheet} ${styles[`sheet-${sheet}`]}`}
            >
              {sheet === 'history' ? (
                <HistoryList
                  onSelectJourney={(event) => openSheet('history-detail', event.currentTarget)}
                />
              ) : null}
              {sheet === 'history-detail' ? <JourneyDetail /> : null}
              {sheet === 'ticket' ? (
                <>
                  <h3 className={styles.sheetTitle}>TICKET</h3>
                  <BoardingTicketCard pass={passportTicket} size="md" />
                </>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function PassportSpread({ step, onHistory, onTicket, onProducts }) {
  if (step === 0) {
    return (
      <section className={`${styles.passport} ${styles.coverPassport}`} aria-label="여권 표지">
        <img src={passportCover} alt="" className={styles.passportImage} />
        <img src={coverMcm} alt="MCM" className={styles.coverMcm} />
        <img src={coverStar} alt="" className={styles.coverStar} />
        <img src={coverPassport} alt="PASSPORT" className={styles.coverPassportWord} />
        <img src={passportEmblem} alt="" className={styles.coverEmblem} />
        <img src={bowLeft} alt="" className={styles.coverBowLeft} />
        <img src={bowRight} alt="" className={styles.coverBowRight} />
      </section>
    )
  }

  if (step === 1) {
    return (
      <section className={`${styles.passport} ${styles.openPassport}`} aria-label="여권 프로필">
        <img
          src={passportSpread}
          alt=""
          className={`${styles.passportImage} ${styles.openPassportImage}`}
        />
        <div className={styles.profile}>
          <h3>PASSPORT</h3>
          <img src={mcmHaus} alt="MCM HAUS 매장 사진" className={styles.haus} />
          <p>
            NUMBER <strong>{passportProfile.passportNumber}</strong>
          </p>
          <p>
            NATIONALITY <strong>{passportProfile.nationality}</strong>
          </p>
          <p>
            NAME{' '}
            <strong>
              {passportProfile.givenName} {passportProfile.surname}
            </strong>
          </p>
          <p>
            DATE OF ISSUE <strong>{passportProfile.issueDate}</strong>
          </p>
          <p>
            CREDIT <strong>{passportProfile.credit}</strong>
          </p>
          <small className={styles.profileFooter}>
            <span>크레딧으로 AI 가상 피팅 가능</span>
            <button type="button" onClick={onProducts}>
              제품 보러가기
            </button>
          </small>
        </div>
      </section>
    )
  }

  if (step === 2) {
    return (
      <section
        className={`${styles.passport} ${styles.openPassport}`}
        aria-label="여권 방문 스탬프"
      >
        <img
          src={passportSpread}
          alt=""
          className={`${styles.passportImage} ${styles.openPassportImage}`}
        />
        <div className={styles.stamps}>
          <h3>PASSPORT</h3>
          <p>총 방문 횟수 | {passportProfile.visits}회</p>
          <img src={passportStampBow} alt="" className={styles.stampBow} />
          <ul>
            {passportStamps.map((stamp) => (
              <li key={stamp.id}>
                <img src={passportStamp} alt="" />
                <time>{stamp.date}</time>
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  return (
    <section className={`${styles.passport} ${styles.openPassport}`} aria-label="여권 여행 기록">
      <img
        src={passportSpread}
        alt=""
        className={`${styles.passportImage} ${styles.openPassportImage}`}
      />
      <div role="img" aria-label="비행기와 탑승권" className={styles.journeyArtwork}>
        <span className={styles.journeyTile}>
          <img src={journeyDecoration} alt="" className={styles.journeyDecoration} />
        </span>
        <span className={styles.journeyTile}>
          <span className={styles.journeyTicketGroup}>
            <img src={journeyTicket} alt="" className={styles.journeyTicket} />
            <img src={journeyTicketMark} alt="" className={styles.journeyTicketMark} />
          </span>
        </span>
      </div>
      <h3 className={styles.journeyHeading}>PASSPORT</h3>
      <div className={styles.journeys}>
        <p>
          <time>2026 07 27</time>
          <strong>MCM HAUS</strong>
          <span>412 Apgujeong-ro, Gangnam-gu, Seoul of Korea</span>
        </p>
        <p>
          <strong>입장 번호 00001 | 비행 시간 46M</strong>
        </p>
        <div className={styles.journeyActions}>
          <button type="button" onClick={onHistory} className={styles.history}>
            TRAVEL HISTORY
          </button>
          <button
            type="button"
            onClick={onTicket}
            className={styles.history}
            aria-label="티켓 보기"
          >
            TICKET
          </button>
        </div>
      </div>
    </section>
  )
}

function HistoryList({ onSelectJourney }) {
  return (
    <>
      <h3 className={styles.sheetTitle}>TRAVEL HISTORY</h3>
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

function JourneyDetail() {
  const journey = journeyRecords[0]
  return (
    <>
      <h3 className={styles.sheetTitle}>TRAVEL HISTORY</h3>
      <article className={styles.historyCard}>
        <JourneyCard record={journey} />
      </article>
      <div className={styles.detailCopy}>
        <h4>1976년, München - 밤의 도시가 낳은 대담함</h4>
        <p>
          1976년 뮌헨, 데이비드 보위와 프레디 머큐리가 밤거리를 자유롭게 거닐며 예술과 반항을
          모의하던 시절
        </p>
        <p>
          배우이자 창립자인 미하엘 크로머(Michael Cromer)는 이 도시의 시대 정신을 담아낼 하나의
          이름을 지었습니다
        </p>
        <h4>Modern Creation München</h4>
        <p>
          그것은 단순한 가방 브랜드의 탄생이 아닌 정체되어 있던 당시 럭셔리 씬을 향한 대담한
          선언이었습니다
        </p>
        <p>화려함 그 자체 보다 ‘어디론가 떠날 수 있는 태도’를 가방에 주입하고자 했던 순간</p>
        <p>MCM의 여정을 지금 시작합니다</p>
      </div>
    </>
  )
}

function JourneyCard({ record }) {
  return (
    <span className={styles.journeyCardContent}>
      <span>{record.floor}</span>
      <strong>{record.title}</strong>
    </span>
  )
}
