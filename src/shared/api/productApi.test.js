import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatPrice, getProduct, getProducts } from './productApi.js'

/**
 * 백엔드는 목록을 색 단위로 펼쳐 준다. 같은 productId가 여러 번 나오는 것이
 * 정상이고, 목록의 한 칸을 가리키는 열쇠는 productColorId다. 이걸 productId로
 * 뭉뚱그리면 위시리스트가 엉뚱한 색에 붙는다.
 */
function respondWith(result, { status = 200 } = {}) {
  const body = JSON.stringify({ isSuccess: status === 200, code: 'COMMON200', result })
  return vi.fn().mockResolvedValue({
    ok: status === 200,
    status,
    text: () => Promise.resolve(body),
  })
}

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.stubGlobal('fetch', undefined)
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('상품 목록', () => {
  it('같은 상품의 색 두 줄을 합치지 않고 각각 productColorId로 구분한다', async () => {
    globalThis.fetch = respondWith([
      {
        productId: 1,
        productColorId: 1,
        name: 'Diamant 비세토스 3D 참',
        price: 490000,
        thumbnailImageUrl: 'https://cdn/soft-pink-1.jpg',
        colors: [
          { productColorId: 1, colorName: 'Soft Pink', colorHex: '#F5C6D0', isDefault: true },
          { productColorId: 2, colorName: 'Brown', colorHex: '#6B4226', isDefault: false },
        ],
        isWished: true,
      },
      {
        productId: 1,
        productColorId: 2,
        name: 'Diamant 비세토스 3D 참',
        price: 490000,
        thumbnailImageUrl: 'https://cdn/brown-1.jpg',
        colors: [],
        isWished: false,
      },
    ])

    const products = await getProducts()

    expect(products).toHaveLength(2)
    expect(products.map((p) => p.productColorId)).toEqual([1, 2])
    expect(products.map((p) => p.id)).toEqual([1, 1])
    expect(products[0].isWished).toBe(true)
    expect(products[1].isWished).toBe(false)
  })

  it('가격을 Figma 표기로 붙이고 원본 숫자도 남긴다', async () => {
    globalThis.fetch = respondWith([{ productId: 1, productColorId: 1, price: 490000 }])

    const [product] = await getProducts()

    expect(product.priceLabel).toBe('₩490,000')
    expect(product.price).toBe(490000)
  })

  it('색 목록이 없어도 터지지 않는다', async () => {
    globalThis.fetch = respondWith([{ productId: 9, productColorId: 9 }])

    const [product] = await getProducts()

    expect(product.colors).toEqual([])
    expect(product.name).toBe('')
    expect(product.thumbnailImageUrl).toBeNull()
  })
})

describe('상품 상세', () => {
  it('색마다 이미지와 사이즈를 중첩해 돌려준다', async () => {
    globalThis.fetch = respondWith({
      productId: 1,
      name: 'Diamant 비세토스 3D 참',
      price: 490000,
      description: '상품 설명',
      colors: [
        {
          productColorId: 1,
          colorName: 'Soft Pink',
          colorHex: '#F5C6D0',
          isDefault: true,
          images: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
          sizes: [
            {
              productSizeId: 1,
              sizeLabel: '프리 사이즈',
              sizeNote: null,
              sku: 'MWRGAOB01CO001',
              stock: 5,
            },
          ],
          isWished: true,
        },
      ],
    })

    const product = await getProduct(1)

    expect(product.description).toBe('상품 설명')
    expect(product.colors[0].images).toHaveLength(2)
    // 쇼핑백에 담을 때 쓰는 열쇠다. 색 번호와 섞이면 안 된다.
    expect(product.colors[0].sizes[0].productSizeId).toBe(1)
    expect(product.colors[0].sizes[0].stock).toBe(5)
    expect(product.colors[0].hex).toBe('#F5C6D0')
  })

  it('없는 상품이면 오류가 아니라 null이다', async () => {
    // 404를 던지면 화면이 "없음"과 "실패"를 구분하지 못한다.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () =>
        Promise.resolve(
          JSON.stringify({ isSuccess: false, code: 'PRODUCT_NOT_FOUND', message: '없음' }),
        ),
    })

    await expect(getProduct(999)).resolves.toBeNull()
  })
})

describe('가격 표기', () => {
  it('숫자가 아니면 빈 문자열이다', () => {
    expect(formatPrice(null)).toBe('')
    expect(formatPrice(undefined)).toBe('')
    expect(formatPrice(0)).toBe('₩0')
  })
})
