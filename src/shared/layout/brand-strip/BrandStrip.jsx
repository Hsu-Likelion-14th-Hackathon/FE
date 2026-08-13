import { useLayoutEffect, useRef, useState } from 'react'

import headerDiamond from '@/shared/assets/boarding-pass/icons/header-diamond.svg'
import headerDot from '@/shared/assets/boarding-pass/icons/header-dot.svg'

import styles from './BrandStrip.module.scss'

const BRAND_TEXT = 'MCM BOARDING PASS'
/** 같은 묶음을 두 벌 이어 두고 한 벌만큼 움직이면 이음매 없이 순환한다. */
const GROUP_REPEAT = 2
/** 초당 흐르는 거리(px). 화면이 넓어져도 이 속도는 유지한다. */
const SCROLL_SPEED = 12.9

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
  const viewportRef = useRef(null)
  const itemRef = useRef(null)
  // 한 묶음에 넣을 문구 수. 태블릿처럼 넓은 화면에서는 두 벌로는 폭을 못 채운다.
  const [perGroup, setPerGroup] = useState(1)
  const [duration, setDuration] = useState(22)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const item = itemRef.current
    if (!viewport || !item) return undefined

    const measure = () => {
      const itemWidth = item.getBoundingClientRect().width
      const viewportWidth = viewport.getBoundingClientRect().width
      if (!itemWidth || !viewportWidth) return
      // 한 묶음이 화면보다 넓어야 이음매에 빈칸이 보이지 않는다.
      const next = Math.max(1, Math.ceil(viewportWidth / itemWidth) + 1)
      setPerGroup(next)
      // 묶음이 길어진 만큼 시간도 늘려 흐르는 속도를 고정한다.
      setDuration((next * itemWidth) / SCROLL_SPEED)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  const groups = Array.from({ length: GROUP_REPEAT }, (_, groupIndex) => (
    <div key={groupIndex} className={styles.group}>
      {Array.from({ length: perGroup }, (_, index) => (
        <span
          key={index}
          className={styles.item}
          ref={groupIndex === 0 && index === 0 ? itemRef : undefined}
        >
          {BRAND_TEXT}
        </span>
      ))}
    </div>
  ))

  return (
    <div className={styles.strip}>
      <Ornament side="left" />

      <div className={styles.viewport} ref={viewportRef}>
        {as === 'heading' ? (
          <h1 className={styles.srOnly}>{BRAND_TEXT}</h1>
        ) : (
          <span className={styles.srOnly}>{BRAND_TEXT}</span>
        )}
        <div
          aria-hidden="true"
          className={styles.track}
          style={{ '--brand-duration': `${duration}s` }}
        >
          {groups}
        </div>
      </div>

      <Ornament side="right" />
    </div>
  )
}

export default BrandStrip
