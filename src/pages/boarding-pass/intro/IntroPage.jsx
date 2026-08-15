import { useNavigate } from 'react-router'

import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import passCard from '@/shared/assets/boarding-pass/intro/pass-card.png'
import nextArrow from '@/shared/assets/boarding-pass/intro/next-arrow.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './IntroPage.module.scss'

/**
 * (22) 보딩패스 인트로.
 * 패스 카드는 Figma 정적 이미지(보우·리본·카피 포함). Next만 기존 버튼 스타일 유지.
 * Next → (24) 설문. 상태바·홈 인디케이터는 구현하지 않는다.
 */
export function Component() {
  const navigate = useNavigate()

  function handleClose() {
    navigate('/boarding-pass', { replace: true })
  }

  return (
    <main className={styles.page}>
      <StoreHeader />
      <section className={styles.stage}>
        <button type="button" className={styles.close} aria-label="닫기" onClick={handleClose}>
          <img src={closeIcon} alt="" className={styles.closeImg} />
        </button>

        <div className={styles.cluster}>
          <div className={styles.cardWrap}>
            <img
              src={passCard}
              alt="MCM BOARDING PASS — Check-in. 당신의 MCM HAUS 비행을 위한 완벽한 맞춤형 동선을 추천합니다."
              className={styles.passCard}
              draggable={false}
            />
          </div>

          <button
            type="button"
            className={styles.next}
            onClick={() => navigate('/boarding-pass/survey')}
          >
            <span className={styles.nextLabel}>Next</span>
            <img src={nextArrow} alt="" aria-hidden="true" className={styles.nextArrow} />
          </button>
        </div>

        <div className={styles.footerFade} aria-hidden="true" />
      </section>
    </main>
  )
}
