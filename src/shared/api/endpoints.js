const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const apiUrl = (path) => `${API_BASE_URL}${path}`

// 명세서(docs/api)의 경로에는 /api 접두사가 없다. 붙이면 전부 404가 난다.
export const API = {
  session: apiUrl('/session'),
  wishlist: apiUrl('/wishlist'),
  cart: apiUrl('/cart'),
  survey: {
    questions: apiUrl('/surveys/questions'),
  },
  passport: {
    profile: apiUrl('/passport'),
    stamps: apiUrl('/passport/stamps'),
    visit: (visitLogId) => apiUrl(`/passport/visits/${visitLogId}`),
  },
  boardingPass: {
    issue: apiUrl('/boarding-passes'),
    current: apiUrl('/boarding-passes/latest'),
    latest: apiUrl('/boarding-passes/latest'),
    // 명세는 /boarding-passes/{id}/scan 이다. 호출부와 목까지 함께 바꿔야 해서
    // 접두사 정리와 분리한다.
    scan: apiUrl('/boarding-pass/scan'),
  },
}
