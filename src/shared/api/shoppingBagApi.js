import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 쇼핑백 API.
 *
 * 백엔드 경로는 `/shopping-bag`이다. 예전에는 `/cart`를 불렀는데 명세에 없는
 * 경로라 실서버에서 404가 난다. 사용자가 보는 화면 URL은 계속 `/cart`다.
 */
export async function getShoppingBag() {
  const result = await apiFetch(API.shoppingBag, { unwrap: true })
  return result.items ?? []
}
