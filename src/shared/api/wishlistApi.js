import { apiFetch } from './client.js'
import { API } from './endpoints.js'

export async function getWishlist() {
  const result = await apiFetch(API.wishlist, { unwrap: true })
  return result.items ?? []
}
