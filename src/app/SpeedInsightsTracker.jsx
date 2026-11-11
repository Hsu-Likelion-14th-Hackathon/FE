import { SpeedInsights } from '@vercel/speed-insights/react'
import { useMatches } from 'react-router'

import { toRoutePattern } from './routePattern.js'

/**
 * 실사용자 성능 측정(Vercel Speed Insights).
 *
 * Lighthouse는 실험실 측정이라 실제 사용자의 기기·회선을 반영하지 못한다.
 * 이 컴포넌트가 방문자 브라우저에서 Core Web Vitals를 모아 Vercel로 보낸다.
 * 대시보드에서 프로젝트의 Speed Insights를 켜야 수집된다.
 *
 * route는 주소가 아니라 라우트 패턴으로 넘긴다(/products/12 → /products/:productId).
 * 주소 그대로면 상품마다 따로 집계돼 화면 단위로 비교할 수 없다.
 */

export default function SpeedInsightsTracker() {
  const matches = useMatches()
  const last = matches[matches.length - 1]
  const route = last ? toRoutePattern(last.pathname, last.params) : null

  return <SpeedInsights route={route} />
}
