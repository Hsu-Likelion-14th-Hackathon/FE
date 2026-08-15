import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addToShoppingBag, getShoppingBag, removeFromShoppingBag } from './shoppingBagApi.js'
import { addToWishlist, getWishlist, removeFromWishlist } from './wishlistApi.js'

/**
 * 위시리스트와 쇼핑백은 서로 다른 id를 쓴다. 이름이 비슷해 섞기 쉬운데,
 * 섞으면 조용히 엉뚱한 항목이 지워진다(둘 다 숫자라 타입으로도 안 걸린다).
 *
 *   위시리스트 담기/빼기  productColorId
 *   쇼핑백 담기           productSizeId
 *   쇼핑백 빼기           shoppingBagItemId
 */
function respondWith(result) {
  const body = JSON.stringify({ isSuccess: true, code: 'COMMON200', result })
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(body),
  })
}

/** fetch에 실제로 나간 URL과 본문 */
function callOf(fetchMock) {
  const [url, init] = fetchMock.mock.calls[0]
  return { url, method: init.method, body: init.body ? JSON.parse(init.body) : null }
}

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.stubGlobal('fetch', undefined)
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('위시리스트', () => {
  it('목록을 화면이 쓰는 모양으로 돌려준다', async () => {
    globalThis.fetch = respondWith({
      items: [
        {
          productColorId: 2,
          productId: 1,
          name: 'Diamant 비세토스 3D 참',
          price: 490000,
          thumbnailImageUrl: 'https://cdn/brown.jpg',
          colorName: 'Brown',
        },
      ],
      totalCount: 1,
    })

    const items = await getWishlist()

    expect(items).toHaveLength(1)
    expect(items[0].productColorId).toBe(2)
    expect(items[0].colorName).toBe('Brown')
  })

  it('비어 있으면 빈 배열이다', async () => {
    globalThis.fetch = respondWith({ items: [], totalCount: 0 })

    await expect(getWishlist()).resolves.toEqual([])
  })

  it('담을 때 productColorId를 본문에 싣는다', async () => {
    const fetchMock = respondWith({ productColorId: 2 })
    globalThis.fetch = fetchMock

    await addToWishlist(2)

    const call = callOf(fetchMock)
    expect(call.method).toBe('POST')
    expect(call.body).toEqual({ productColorId: 2 })
  })

  it('뺄 때 경로에 productColorId를 쓴다', async () => {
    // 위시리스트 항목 번호가 따로 있는 게 아니다. 색 번호가 곧 열쇠다.
    const fetchMock = respondWith({ removed: true })
    globalThis.fetch = fetchMock

    await expect(removeFromWishlist(2)).resolves.toBe(true)
    expect(callOf(fetchMock).url).toMatch(/\/wishlist\/2$/)
    expect(callOf(fetchMock).method).toBe('DELETE')
  })

  it('서버에 없던 항목이면 removed가 false다', async () => {
    globalThis.fetch = respondWith({ removed: false })

    await expect(removeFromWishlist(99)).resolves.toBe(false)
  })
})

describe('쇼핑백', () => {
  it('사이즈와 수량까지 담아 돌려준다', async () => {
    globalThis.fetch = respondWith({
      items: [
        {
          shoppingBagItemId: 10,
          productSizeId: 1,
          productId: 1,
          name: 'Diamant 비세토스 3D 참',
          price: 490000,
          thumbnailImageUrl: 'https://cdn/pink.jpg',
          colorName: 'Soft Pink',
          sizeLabel: '프리 사이즈',
          sizeNote: null,
          sku: 'MWRGAOB01CO001',
          quantity: 2,
        },
      ],
      totalCount: 1,
    })

    const [item] = await getShoppingBag()

    expect(item.shoppingBagItemId).toBe(10)
    expect(item.productSizeId).toBe(1)
    expect(item.quantity).toBe(2)
    expect(item.sizeLabel).toBe('프리 사이즈')
  })

  it('수량이 없으면 1로 본다', async () => {
    globalThis.fetch = respondWith({ items: [{ shoppingBagItemId: 10 }], totalCount: 1 })

    const [item] = await getShoppingBag()

    expect(item.quantity).toBe(1)
  })

  it('담을 때 productSizeId를 싣는다', async () => {
    // 색까지만 고르면 담기지 않는다. 사이즈를 정해야 한다.
    const fetchMock = respondWith({ shoppingBagItemId: 10 })
    globalThis.fetch = fetchMock

    await addToShoppingBag(1)

    expect(callOf(fetchMock).body).toEqual({ productSizeId: 1 })
  })

  it('뺄 때는 productSizeId가 아니라 shoppingBagItemId를 경로에 쓴다', async () => {
    // 둘 다 숫자라 바꿔 넣어도 요청은 성공한다. 다른 항목이 지워질 뿐이다.
    const fetchMock = respondWith({ removed: true })
    globalThis.fetch = fetchMock

    await expect(removeFromShoppingBag(10)).resolves.toBe(true)
    expect(callOf(fetchMock).url).toMatch(/\/shopping-bag\/10$/)
  })
})
