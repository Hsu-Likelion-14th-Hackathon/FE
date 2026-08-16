import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getFloor, getFloors } from './floorApi.js'

/**
 * 층 계약의 함정들.
 *
 *   - 화면의 층 열쇠는 floorId(숫자)가 아니라 `1f` 같은 소문자 키다.
 *   - 상세 콘텐츠 순서는 배열 순서가 아니라 orderNo가 정한다.
 */
function respondWith(result) {
  const body = JSON.stringify({ isSuccess: true, code: 'COMMON200', result })
  return vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(body) })
}

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.stubGlobal('fetch', undefined)
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('층 목록', () => {
  it('층마다 화면 열쇠와 Figma 배지 표기를 만든다', async () => {
    globalThis.fetch = respondWith({
      storeName: 'MCM HAUS',
      floors: [{ floorId: 11, floorNo: 1, code: 'JOURNEY', title: '여정', tagline: '대담함' }],
    })

    const { storeName, floors } = await getFloors()

    expect(storeName).toBe('MCM HAUS')
    expect(floors[0].id).toBe('1f')
    // 배지 칸은 캔버스가 이 문자열을 그대로 그린다. 간격까지 표기의 일부다.
    expect(floors[0].badge).toBe('1F JOURNEY  |  여정')
  })
})

describe('층 상세', () => {
  it('콘텐츠 블록을 orderNo 순서로 정렬하고 상품 블록은 가격 표기까지 만든다', async () => {
    globalThis.fetch = respondWith({
      floorId: 11,
      floorNo: 1,
      code: 'JOURNEY',
      title: '여정',
      contents: [
        // 배열은 순서를 보장하지 않는다.
        { orderNo: 2, blockType: 'IMAGE', imageUrl: 'https://cdn/floor.jpg' },
        { orderNo: 1, blockType: 'TEXT', body: '뮌헨에서 시작된 이야기' },
        {
          orderNo: 3,
          blockType: 'PRODUCT',
          product: { productId: 1, name: 'Diamant 참', price: 490000 },
        },
      ],
    })

    const floor = await getFloor(11)

    expect(floor.contents.map((block) => block.orderNo)).toEqual([1, 2, 3])
    expect(floor.contents[0].body).toBe('뮌헨에서 시작된 이야기')
    expect(floor.contents[2].product).toEqual({
      productId: 1,
      name: 'Diamant 참',
      priceLabel: '₩490,000',
      imageUrl: null,
    })
  })

  it('콘텐츠가 없어도 빈 배열로 그릴 수 있게 한다', async () => {
    // 층 시드가 비어 있는 게 현재 실서버 상태다(백로그 블로커 3).
    globalThis.fetch = respondWith({ floorId: 11, floorNo: 1, code: 'JOURNEY', title: '여정' })

    const floor = await getFloor(11)

    expect(floor.contents).toEqual([])
  })
})
