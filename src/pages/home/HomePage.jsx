import { Link } from 'react-router'

import boardingArrow from '@/assets/icons/boarding-arrow.svg'
import planeIcon from '@/assets/icons/plane.svg'
import heroPlaneImage from '@/assets/images/home/hero-plane.png'
import heroSuitcaseImage from '@/assets/images/home/hero-suitcase.png'
import heroWatchImage from '@/assets/images/home/hero-watch.png'
import useScaleToFit from '@/shared/layout/scale-to-fit/useScaleToFit.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './HomePage.module.scss'

/** 히어로 설계 캔버스 — 390×844에서 헤더 97과 상태바 44를 뺀 크기. */
const HERO_WIDTH = 390
const HERO_HEIGHT = 703
/* 히어로 이미지 원본은 1024px다. 가장 크게 놓이는 비행기가 설계에서 357px이라
   2.4배(857px)까지는 원본 안에서 확대되어 뭉개지지 않는다. */
const HERO_MAX_SCALE = 2.4

function BoardingButton() {
  return (
    <Link className={styles.boardingButton} to="/boarding-pass/intro">
      <span>Boarding</span>
      <span className={styles.boardingArrow} aria-hidden="true">
        <img src={boardingArrow} alt="" />
      </span>
    </Link>
  )
}

export function Component() {
  const [heroRef, heroScale] = useScaleToFit(HERO_WIDTH, HERO_HEIGHT, HERO_MAX_SCALE)

  return (
    <div className={styles.introPage}>
      <StoreHeader />
      <section className={styles.introHero} aria-labelledby="boarding-title" ref={heroRef}>
        <div className={styles.heroStage} style={{ '--hero-scale': heroScale }}>
          <div className={styles.heroGlowTop} aria-hidden="true" />
          <div className={styles.heroGlowLeft} aria-hidden="true" />
          <div className={styles.glowFrame} aria-hidden="true">
            <div className={styles.glow} />
          </div>

          <div className={styles.introSuitcase} aria-hidden="true">
            <img src={heroSuitcaseImage} alt="" />
          </div>
          <div className={styles.introPlane} aria-hidden="true">
            <img src={heroPlaneImage} alt="" />
          </div>
          <div className={styles.introWatch} aria-hidden="true">
            <img src={heroWatchImage} alt="" />
          </div>

          <div className={styles.introCopy}>
            <img className={styles.planeIconLarge} src={planeIcon} alt="" />
            <h1 id="boarding-title" aria-label="메인">
              <span>MCM</span>
              <span>BOARDING</span>
              <span>PASS</span>
            </h1>
          </div>

          <div className={styles.introFlightPathTop} aria-hidden="true" />
          <div className={styles.introFlightPathBottom} aria-hidden="true" />
          <BoardingButton />
        </div>
      </section>
    </div>
  )
}
