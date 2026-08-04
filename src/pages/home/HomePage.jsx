import { useState } from 'react'
import { Link } from 'react-router'

import boardingArrow from '@/assets/icons/boarding-arrow.svg'
import circleArrow from '@/assets/icons/circle-arrow.svg'
import planeIcon from '@/assets/icons/plane.svg'
import collectionImage from '@/assets/images/home/aw26-collection.webp'
import cardPlaneImage from '@/assets/images/home/hero-card-plane.webp'
import heroPlaneImage from '@/assets/images/home/hero-plane.webp'
import heroSuitcaseImage from '@/assets/images/home/hero-suitcase.webp'
import heroWatchImage from '@/assets/images/home/hero-watch.webp'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './HomePage.module.scss'

const BOARDING_SESSION_KEY = 'mcm-boarding-complete'

function hasBoardedInCurrentSession() {
  try {
    return window.sessionStorage.getItem(BOARDING_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function BoardingButton({ onClick, compact = false }) {
  const Component = onClick ? 'button' : Link
  const linkProps = onClick ? { onClick, type: 'button' } : { to: '/products' }

  return (
    <Component
      className={`${styles.boardingButton} ${compact ? styles.boardingButtonCompact : ''}`}
      {...linkProps}
    >
      <span>Boarding</span>
      <img src={boardingArrow} alt="" />
    </Component>
  )
}

function BoardingIntro({ onBoard }) {
  return (
    <div className={styles.introPage}>
      <StoreHeader />
      <section className={styles.introHero} aria-labelledby="boarding-title">
        <div className={styles.glow} aria-hidden="true" />
        <img className={styles.introSuitcase} src={heroSuitcaseImage} alt="" />
        <img className={styles.introPlane} src={heroPlaneImage} alt="" />
        <img className={styles.introWatch} src={heroWatchImage} alt="" />

        <div className={styles.introCopy}>
          <img className={styles.planeIconLarge} src={planeIcon} alt="" />
          <h1 id="boarding-title" aria-label="메인">
            <span>MCM</span>
            <span>BOARDING</span>
            <span>PASS</span>
          </h1>
        </div>

        <div className={styles.introFlightPath} aria-hidden="true" />
        <BoardingButton onClick={onBoard} />
      </section>
    </div>
  )
}

function ContentLink({ children }) {
  return (
    <div className={styles.contentLink}>
      <span>{children}</span>
      <img src={circleArrow} alt="" />
    </div>
  )
}

function BoardingCard() {
  return (
    <Link className={styles.contentGroup} to="/products" aria-label="MCM Boarding Pass 둘러보기">
      <div className={styles.boardingCard}>
        <img className={styles.cardPlane} src={cardPlaneImage} alt="" />
        <img className={styles.cardPlaneIcon} src={planeIcon} alt="" />
        <p className={styles.cardTitle}>
          <span>MCM</span>
          <span>BOARDING</span>
          <span>PASS</span>
        </p>
        <div className={styles.cardFlightPath} aria-hidden="true" />
        <BoardingButton compact />
      </div>
      <ContentLink>MCM BOARDING PASS</ContentLink>
    </Link>
  )
}

function CollectionCard() {
  return (
    <Link className={styles.contentGroup} to="/products">
      <div className={styles.collectionCard}>
        <img src={collectionImage} alt="2026 가을-겨울 컬렉션 모델" />
        <span>Autumn Winter 2026</span>
      </div>
      <ContentLink>2026 가을-겨울 컬렉션 둘러보기</ContentLink>
    </Link>
  )
}

function HomeLanding() {
  return (
    <div className={styles.landingPage}>
      <StoreHeader />
      <div className={styles.landingContent}>
        <h1 className="sr-only">메인</h1>
        <BoardingCard />
        <CollectionCard />
        <Link className={styles.loginButton} to="/login">
          로그인
        </Link>
      </div>
    </div>
  )
}

export function Component() {
  const [hasBoarded, setHasBoarded] = useState(hasBoardedInCurrentSession)

  function handleBoarding() {
    try {
      window.sessionStorage.setItem(BOARDING_SESSION_KEY, 'true')
    } catch {
      // 세션 저장소를 사용할 수 없는 브라우저에서도 화면 전환은 유지한다.
    }

    setHasBoarded(true)
  }

  return hasBoarded ? <HomeLanding /> : <BoardingIntro onBoard={handleBoarding} />
}
