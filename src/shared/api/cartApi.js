import { apiFetch } from './client.js'
import { API } from './endpoints.js'

export async function getCart() {
  const data = await apiFetch(API.cart)
  return data.items
}
