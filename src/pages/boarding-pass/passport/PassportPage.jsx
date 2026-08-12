import { useState } from 'react'
import { useNavigate } from 'react-router'

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

import { journeyRecords, passportProfile, passportStamps } from './passportData.js'
import styles from './PassportPage.module.scss'

export function Component() {
  const navigate = useNavigate()
  const bagHandlers = useBagHandlers()
  const [step, setStep] = useState(0)
  const progress = (step + 1) * 25

  return (
    <div className={styles.page}>
      <BoardingPassChrome {...bagHandlers} />
      <main className={styles.stage} aria-labelledby="passport-title">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => navigate('/boarding-pass')}
          className={styles.close}
        >
          <img src={closeIcon} alt="" />
        </button>
        <h2 id="passport-title" className={styles.srOnly}>
          MCM PASSPORT
        </h2>
        <PassportSpread step={step} onProducts={() => navigate('/products')} />
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
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <img src={navPrev} alt="" />
          </button>
          <button
            type="button"
            aria-label="다음 단계"
            disabled={step === 3}
            onClick={() => setStep((current) => Math.min(3, current + 1))}
          >
            <img src={navNext} alt="" />
          </button>
        </nav>
      </main>
    </div>
  )
}

function PassportSpread({ step, onProducts }) {
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
          <img src={mcmHaus} alt="MCM HAUS" className={styles.haus} />
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
      <img src={journeyDecoration} alt="" className={styles.passportImage} />
      <div className={styles.journeys}>
        {journeyRecords.map((record) => (
          <p key={record.id}>
            <span>{record.floor}</span>
            <strong>{record.title}</strong>
            <time>{record.date}</time>
          </p>
        ))}
        <button type="button" onClick={onProducts} className={styles.products}>
          상품 보러가기
        </button>
      </div>
    </section>
  )
}
