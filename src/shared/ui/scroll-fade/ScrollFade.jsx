import { useEffect, useRef, useState } from 'react'

import observeResize from '@/shared/layout/observe-resize.js'

import styles from './ScrollFade.module.scss'

/** 바닥에서 이만큼 안쪽이면 끝에 닿은 것으로 본다. */
const END_SLACK_PX = 8

/**
 * 실제로 스크롤되는 조상을 찾는다.
 *
 * 모바일은 문서가 스크롤되지만 데스크톱은 아이폰 틀 안쪽이 스크롤된다.
 * 문서만 보고 판단하면 데스크톱에서 페이드가 사라지지 않는다.
 */
function findScroller(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    const scrollable = overflowY === 'auto' || overflowY === 'scroll'
    // overflow-x만 hidden이어도 계산된 overflow-y가 auto가 된다. 그래서
    // 실제로 넘칠 내용이 있는지까지 봐야 엉뚱한 조상을 잡지 않는다.
    if (scrollable && el.scrollHeight > el.clientHeight) return el
  }
  return document.scrollingElement ?? document.documentElement
}

/**
 * 목록 화면 바닥에 깔리는 페이드.
 *
 * 아래로 더 볼 게 남았다는 신호다. 그래서 볼 게 없으면 나오면 안 된다. 늘 떠
 * 있으면 짧은 목록에서는 마지막 카드를 가리고, 끝까지 내려간 뒤에도 마지막
 * 항목이 60%까지 어두워진다.
 *
 * 읽는 데 방해가 되면 안 되므로 클릭은 통과시키고 스크린리더에서는 감춘다.
 */
function ScrollFade() {
  const fadeRef = useRef(null)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    let detach = () => {}

    const attach = () => {
      detach()
      const scroller = findScroller(fadeRef.current)
      if (!scroller) return

      const update = () => {
        const remaining = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
        setAtEnd(remaining <= END_SLACK_PX)
      }

      update()
      // 목록이 늘거나 줄어도 남은 양이 달라진다.
      const stopObserving = observeResize(scroller, update)
      const target = scroller === document.scrollingElement ? window : scroller
      target.addEventListener('scroll', update, { passive: true })
      detach = () => {
        stopObserving()
        target.removeEventListener('scroll', update)
      }
    }

    attach()

    // 데스크톱은 문서가 아니라 아이폰 틀 안쪽이 스크롤된다. 경계를 넘나들면
    // 스크롤되는 요소 자체가 바뀌므로 다시 찾아 붙여야 한다.
    const desktop = window.matchMedia?.('(min-width: 1200px)')
    desktop?.addEventListener?.('change', attach)
    return () => {
      detach()
      desktop?.removeEventListener?.('change', attach)
    }
  }, [])

  // 스크롤 조상을 찾으려면 DOM에 남아 있어야 하므로 지우지 않고 감춘다.
  return <div ref={fadeRef} className={styles.scrollFade} aria-hidden="true" data-at-end={atEnd} />
}

export default ScrollFade
