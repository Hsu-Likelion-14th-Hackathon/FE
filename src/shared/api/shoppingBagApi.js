import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 쇼핑백 API.
 *
 * 백엔드 경로는 `/shopping-bag`이다. 예전에는 `/cart`를 불렀는데 명세에 없는
 * 경로라 실서버에서 404가 난다. 사용자가 보는 화면 URL은 계속 `/cart`다.
 *
 * 담을 때 쓰는 열쇠는 productSizeId다(색이 아니라 사이즈까지 정해야 담긴다).
 * 뺄 때는 shoppingBagItemId를 쓴다 — 담긴 항목마다 붙는 별도 번호다.
 *
 * 수량을 지정해 담거나 고치는 경로는 명세에 없다. 응답에 quantity가 있으므로
 * 같은 사이즈를 다시 담으면 서버가 올려 주는 것으로 보이나, 확인 전까지
 * 화면에 수량 조절을 붙이지 않는다.
 */

/** GET /shopping-bag */
export async function getShoppingBag({ signal } = {}) {
  const result = await apiFetch(API.shoppingBag, { unwrap: true, signal })
  return (result.items ?? []).map((item) => ({
    shoppingBagItemId: item.shoppingBagItemId,
    productSizeId: item.productSizeId,
    productId: item.productId,
    name: item.name ?? '',
    price: item.price ?? 0,
    thumbnailImageUrl: item.thumbnailImageUrl ?? null,
    colorName: item.colorName ?? '',
    sizeLabel: item.sizeLabel ?? '',
    sizeNote: item.sizeNote ?? null,
    sku: item.sku ?? '',
    quantity: item.quantity ?? 1,
  }))
}

/** POST /shopping-bag */
export async function addToShoppingBag(productSizeId) {
  return apiFetch(API.shoppingBag, {
    method: 'POST',
    body: { productSizeId },
    unwrap: true,
  })
}

/** DELETE /shopping-bag/{shoppingBagItemId} */
export async function removeFromShoppingBag(shoppingBagItemId) {
  const result = await apiFetch(API.shoppingBagItem(shoppingBagItemId), {
    method: 'DELETE',
    unwrap: true,
  })
  return Boolean(result?.removed)
}
