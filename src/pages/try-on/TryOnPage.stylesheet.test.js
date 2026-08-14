import { describe, expect, it } from 'vitest'

// ?raw로 원본 그대로 받는다. fs를 쓰면 테스트에서 node 전역이 필요해진다.
import source from './TryOnPage.module.scss?raw'

/**
 * 미디어 쿼리 선언 순서를 지킨다.
 *
 * 태블릿 보정은 기본 규칙과 특이도가 같아 순서로만 이긴다. 결과 화면 스타일이
 * 뒤에 오면 top: auto가 도로 top: 451px으로 덮여, 768x1024에서 저장 버튼
 * 아래가 300px 가까이 빈다. jsdom은 미디어 쿼리를 적용하지 않아 렌더로는
 * 잡히지 않으므로 원본 순서를 직접 본다.
 */
const TABLET_QUERY = '@media (min-width: 744px) and (max-width: 1199px)'

describe('TryOnPage.module.scss', () => {
  it('태블릿 보정을 결과 화면 기본 규칙보다 뒤에 선언한다', () => {
    const tablet = source.indexOf(TABLET_QUERY)
    expect(tablet).toBeGreaterThan(-1)

    for (const selector of ['\n.productCard {', '\n.saveButton {']) {
      const base = source.indexOf(selector)
      expect(base, `${selector.trim()} 기본 규칙을 찾지 못했다`).toBeGreaterThan(-1)
      expect(base, `${selector.trim()}가 태블릿 보정보다 뒤에 있어 top이 덮인다`).toBeLessThan(
        tablet,
      )
    }
  })

  it('태블릿에서 결과 카드와 저장 버튼을 바닥 기준으로 붙인다', () => {
    const block = source.slice(source.indexOf(TABLET_QUERY))
    expect(block).toContain('top: auto')
    expect(block).toContain('bottom: 74px')
    expect(block).toContain('bottom: 148px')
  })
})
