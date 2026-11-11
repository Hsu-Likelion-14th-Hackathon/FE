import { describe, expect, it } from 'vitest'

import { toRoutePattern } from './routePattern.js'

describe('toRoutePattern', () => {
  it('주소의 파라미터 값을 라우트 패턴으로 바꾼다', () => {
    expect(toRoutePattern('/products/12', { productId: '12' })).toBe('/products/:productId')
    expect(toRoutePattern('/products/12/try-on', { productId: '12' })).toBe(
      '/products/:productId/try-on',
    )
  })

  it('파라미터가 없으면 주소 그대로다', () => {
    expect(toRoutePattern('/boarding-pass/guide')).toBe('/boarding-pass/guide')
  })

  it('없는 경로(*)의 나머지 주소는 그대로 둔다', () => {
    expect(toRoutePattern('/nope/here', { '*': 'nope/here' })).toBe('/nope/here')
  })
})
