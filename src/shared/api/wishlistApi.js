import { apiFetch } from './client.js'
import { API } from './endpoints.js'

export async function getWishlist() {
  const data = await apiFetch(API.wishlist)
  return data.items
}
