import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 상품 API.
 *
 * 백엔드는 색상을 행으로 펼쳐 준다. `GET /products`는 상품 하나에 색이 둘이면
 * 같은 productId를 가진 항목을 둘 돌려준다. 목록 화면이 그리는 카드도 색 단위라
 * 그대로 쓰면 된다. 대신 목록의 한 항목을 가리키는 열쇠는 productId가 아니라
 * productColorId다.
 *
 * id 세 가지가 쓰임새별로 나뉜다. 섞으면 엉뚱한 것이 담긴다.
 *   productId       상세 조회
 *   productColorId  위시리스트, AI 피팅
 *   productSizeId   쇼핑백 담기
 */

const priceFormat = new Intl.NumberFormat('ko-KR')

/** 490000 → `₩490,000` (Figma 표기) */
export function formatPrice(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return `₩${priceFormat.format(value)}`
}

/** 목록과 상세가 색을 조금 다르게 준다. 화면이 쓰는 이름으로 맞춘다. */
function toColor(color) {
  return {
    productColorId: color.productColorId,
    label: color.colorName ?? '',
    // 백엔드가 주는 실제 색값이다. 로컬 토큰(`var(--mcm-color-pink)`)과 달리
    // 새 색이 추가돼도 화면을 고칠 필요가 없다.
    hex: color.colorHex ?? null,
    isDefault: Boolean(color.isDefault),
  }
}

/** GET /products — 목록(색 단위) */
export async function getProducts() {
  const result = await apiFetch(API.product.list, { unwrap: true })
  return (result ?? []).map((item) => ({
    id: item.productId,
    productColorId: item.productColorId,
    name: item.name ?? '',
    price: item.price ?? 0,
    priceLabel: formatPrice(item.price ?? 0),
    thumbnailImageUrl: item.thumbnailImageUrl ?? null,
    colors: (item.colors ?? []).map(toColor),
    isWished: Boolean(item.isWished),
  }))
}

/**
 * GET /products/{productId} — 상세
 *
 * 없는 상품이면 404에 `PRODUCT_NOT_FOUND`가 온다. 화면이 "없음"과 "실패"를
 * 구분해 다루도록 null로 돌려준다.
 */
export async function getProduct(productId) {
  const result = await apiFetch(API.product.detail(productId), {
    unwrap: true,
    notFoundAsNull: true,
  })
  if (!result) return null

  return {
    id: result.productId,
    name: result.name ?? '',
    price: result.price ?? 0,
    priceLabel: formatPrice(result.price ?? 0),
    description: result.description ?? '',
    colors: (result.colors ?? []).map((color) => ({
      ...toColor(color),
      images: color.images ?? [],
      sizes: (color.sizes ?? []).map((size) => ({
        productSizeId: size.productSizeId,
        label: size.sizeLabel ?? '',
        note: size.sizeNote ?? null,
        sku: size.sku ?? '',
        stock: size.stock ?? 0,
      })),
      isWished: Boolean(color.isWished),
    })),
  }
}
