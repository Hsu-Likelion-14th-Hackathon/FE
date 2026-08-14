import { Link } from 'react-router'

import boardingArrow from '@/assets/icons/boarding-arrow.svg'
import planeIcon from '@/assets/icons/plane.svg'
import heroPlaneImage from '@/assets/images/home/hero-plane.png'
import heroSuitcaseImage from '@/assets/images/home/hero-suitcase.png'
import heroWatchImage from '@/assets/images/home/hero-watch.png'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './HomePage.module.scss'

function BoardingButton() {
  return (
    <Link className={styles.boardingButton} to="/boarding-pass">
      <span>Boarding</span>
      <span className={styles.boardingArrow} aria-hidden="true">
        <img src={boardingArrow} alt="" />
      </span>
    </Link>
  )
}

export function Component() {
  return (
    <div className={styles.introPage}>
      <StoreHeader />
      <section className={styles.introHero} aria-labelledby="boarding-title">
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
      </section>
    </div>
  )
}
