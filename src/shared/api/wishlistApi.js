import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 위시리스트 API.
 *
 * 담고 빼는 열쇠는 productColorId다. 같은 가방이라도 색이 다르면 다른 항목이다.
 * 빼는 쪽도 위시리스트 항목 번호가 아니라 productColorId를 경로에 쓴다.
 */

/** GET /wishlist */
export async function getWishlist() {
  const result = await apiFetch(API.wishlist, { unwrap: true })
  return (result.items ?? []).map((item) => ({
    productColorId: item.productColorId,
    productId: item.productId,
    name: item.name ?? '',
    price: item.price ?? 0,
    thumbnailImageUrl: item.thumbnailImageUrl ?? null,
    colorName: item.colorName ?? '',
  }))
}

/** POST /wishlist */
export async function addToWishlist(productColorId) {
  return apiFetch(API.wishlist, {
    method: 'POST',
    body: { productColorId },
    unwrap: true,
  })
}

/**
 * DELETE /wishlist/{productColorId}
 *
 * 응답의 `removed`가 false면 서버에 없던 항목이다. 화면에서는 이미 빠진 것과
 * 같으므로 굳이 구분하지 않지만, 값은 그대로 돌려준다.
 */
export async function removeFromWishlist(productColorId) {
  const result = await apiFetch(API.wishlistItem(productColorId), {
    method: 'DELETE',
    unwrap: true,
  })
  return Boolean(result?.removed)
}
