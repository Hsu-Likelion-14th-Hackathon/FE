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
    // 서버가 상품 블록을 주면 가이드 상품을 따로 불러 덧붙이지 않는다.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('가이드 상품이 없는 층은 콘텐츠가 비어도 빈 배열로 그릴 수 있게 한다', async () => {
    globalThis.fetch = respondWith({ floorId: 1, floorNo: 1, code: 'ORIGIN', title: '기원' })

    const floor = await getFloor(1)

    expect(floor.contents).toEqual([])
  })

  it('서버 콘텐츠에 상품이 없으면 층 코드의 가이드 상품을 끝에 잇는다', async () => {
    // 백엔드가 PRODUCT 블록을 연결할 여유가 없어(2026-08-18) 프론트가 층
    // 코드별 상품을 직접 불러 붙인다. 서버가 블록을 주기 시작하면 위
    // 테스트처럼 그쪽을 그대로 쓴다.
    const floorBody = JSON.stringify({
      isSuccess: true,
      code: 'COMMON200',
      result: {
        floorId: 2,
        floorNo: 2,
        code: 'EMBLEM',
        title: '상징',
        contents: [{ orderNo: 4, blockType: 'TEXT', body: '로고가 아니라, 새겨진 태도' }],
      },
    })
    const productBody = JSON.stringify({
      isSuccess: true,
      code: 'COMMON200',
      result: {
        productId: 9,
        name: '뮌헨 비세토스 토트',
        price: 1290000,
        colors: [
          { productColorId: 22, isDefault: true, images: ['https://cdn/tote.jpg'], sizes: [] },
        ],
      },
    })
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(floorBody) })
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(productBody) })

    const floor = await getFloor(2)

    expect(floor.contents.map((block) => block.blockType)).toEqual(['TEXT', 'PRODUCT'])
    // 기존 마지막 orderNo 다음부터 연번이다.
    expect(floor.contents[1].orderNo).toBe(5)
    expect(floor.contents[1].product).toEqual({
      productId: 9,
      name: '뮌헨 비세토스 토트',
      priceLabel: '₩1,290,000',
      imageUrl: 'https://cdn/tote.jpg',
    })
  })

  it('가이드 상품 조회가 실패해도 층 이야기는 그대로 그린다', async () => {
    const floorBody = JSON.stringify({
      isSuccess: true,
      code: 'COMMON200',
      result: {
        floorId: 2,
        floorNo: 2,
        code: 'EMBLEM',
        title: '상징',
        contents: [{ orderNo: 1, blockType: 'TEXT', body: '로고가 아니라, 새겨진 태도' }],
      },
    })
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(floorBody) })
      .mockRejectedValue(new TypeError('network down'))

    const floor = await getFloor(2)

    expect(floor.contents.map((block) => block.blockType)).toEqual(['TEXT'])
  })
})
