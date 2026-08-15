import { afterEach, describe, expect, it } from 'vitest'

import { PAGE_W, ellipsize, texturePixelRatio } from './passportPageTexture.js'

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

describe('texturePixelRatio', () => {
  const real = window.devicePixelRatio

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', { value: real, configurable: true })
  })

  const withDpr = (dpr) => {
    Object.defineProperty(window, 'devicePixelRatio', { value: dpr, configurable: true })
  }

  it('지면이 실제로 차지하는 픽셀만큼 굽는다', () => {
    withDpr(3)
    // 지면 342px x dpr 3 = 1027개 픽셀. 설계 폭 253.5로 나누면 4.05배가 필요하다.
    // 고정 2배(507px)로 두면 WebGL이 두 배로 늘려 써 글자 획이 뭉개진다.
    const ratio = texturePixelRatio(342)

    expect(ratio * PAGE_W).toBeGreaterThanOrEqual(342 * 3 * 0.98)
  })

  it('0.5 단위로 끊어 창을 조금 흔들 때 다시 굽지 않는다', () => {
    withDpr(2)

    expect(texturePixelRatio(300)).toBe(texturePixelRatio(302))
    expect(texturePixelRatio(300) % 0.5).toBe(0)
  })

  it('아무리 커도 4배를 넘지 않고, 아무리 작아도 쓰던 2배 아래로 내려가지 않는다', () => {
    withDpr(4)
    expect(texturePixelRatio(600)).toBe(4)

    withDpr(1)
    expect(texturePixelRatio(120)).toBe(2)
  })
})
