import headerDiamond from '@/shared/assets/boarding-pass/icons/header-diamond.svg'
import headerDot from '@/shared/assets/boarding-pass/icons/header-dot.svg'

import styles from './BrandStrip.module.scss'

const BRAND_TEXT = 'MCM BOARDING PASS'
/** 끊김 없이 이어지도록 트랙을 두 벌 복제한다. */
const TRACK_REPEAT = 2

function Ornament({ side }) {
  const dots = [
    <img key="dot-1" src={headerDot} alt="" className={styles.dot} />,
    <img key="dot-2" src={headerDot} alt="" className={styles.dot} />,
  ]
  const diamond = <img key="diamond" src={headerDiamond} alt="" className={styles.diamond} />

  return (
    <span aria-hidden="true" className={styles.ornament}>
      {side === 'left' ? [...dots, diamond] : [diamond, ...dots]}
    </span>
  )
}

/**
 * 보딩패스 브랜드 스트립.
 *
 * 문자가 전광판처럼 왼쪽에서 오른쪽으로 흐르며 순환한다. 흐르는 트랙은
 * 텍스트를 반복하므로 스크린리더가 여러 번 읽지 않도록 aria-hidden으로 감추고,
 * 읽을 텍스트는 heading으로 한 번만 노출한다.
 *
 * @param {'heading'|'decorative'} as heading이면 h1으로 제목 역할을 맡는다.
 */
function BrandStrip({ as = 'decorative' }) {
  const track = Array.from({ length: TRACK_REPEAT }, (_, index) => (
    <span key={index} className={styles.item}>
      {BRAND_TEXT}
    </span>
  ))

  return (
    <div className={styles.strip}>
      <Ornament side="left" />

      <div className={styles.viewport}>
        {as === 'heading' ? (
          <h1 className={styles.srOnly}>{BRAND_TEXT}</h1>
        ) : (
          <span className={styles.srOnly}>{BRAND_TEXT}</span>
        )}
        <div aria-hidden="true" className={styles.track}>
          {track}
        </div>
      </div>

      <Ornament side="right" />
    </div>
  )
}

export default BrandStrip
