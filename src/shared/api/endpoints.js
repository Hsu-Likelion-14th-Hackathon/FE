const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const apiUrl = (path) => `${API_BASE_URL}${path}`

export const API = {
  session: apiUrl('/api/session'),
  wishlist: apiUrl('/api/wishlist'),
  cart: apiUrl('/api/cart'),
  survey: {
    questions: apiUrl('/api/surveys/questions'),
  },
  boardingPass: {
    issue: apiUrl('/api/boarding-passes'),
    current: apiUrl('/api/boarding-passes/latest'),
    latest: apiUrl('/api/boarding-passes/latest'),
    scan: apiUrl('/api/boarding-pass/scan'),
  },
}
