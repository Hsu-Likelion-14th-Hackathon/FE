import { describe, expect, it } from 'vitest'

import { ellipsize } from './passportPageTexture.js'

/**
 * jsdom에는 진짜 2D 컨텍스트가 없다. 폭 계산만 검증하면 되므로 글자당 6px로
 * 재는 가짜 컨텍스트를 쓴다.
 */
const CHAR_W = 6
const ctx = { measureText: (text) => ({ width: text.length * CHAR_W }) }

describe('ellipsize', () => {
  it('들어가는 글자는 그대로 둔다', () => {
    expect(ellipsize(ctx, 'YEONJU LIM', 100)).toBe('YEONJU LIM')
  })

  it('넘치면 말줄임표를 붙여 폭 안에 담는다', () => {
    const long = 'A'.repeat(39)
    const result = ellipsize(ctx, long, 60)

    expect(result).not.toBe(long)
    expect(result.endsWith('…')).toBe(true)
    expect(ctx.measureText(result).width).toBeLessThanOrEqual(60)
    // 한 글자만 빼고 자르면 안 된다. 10칸에 맞춰 9자 + 말줄임표가 되어야 한다.
    expect(result).toBe(`${'A'.repeat(9)}…`)
  })

  it('말줄임표조차 못 들어가면 아무것도 그리지 않는다', () => {
    expect(ellipsize(ctx, 'ABCDEF', CHAR_W - 1)).toBe('')
    expect(ellipsize(ctx, 'ABCDEF', 0)).toBe('')
    expect(ellipsize(ctx, 'ABCDEF', -10)).toBe('')
  })
})
