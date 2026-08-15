const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const apiUrl = (path) => `${API_BASE_URL}${path}`

/**
 * 백엔드 endpoint 목록.
 *
 * 명세서(docs/api)와 라이브 Swagger의 경로에는 `/api` 접두사가 없다. 붙이면
 * 전부 404가 난다.
 *
 * 여기서 다루는 것은 백엔드 경로다. 사용자가 보는 화면 URL과는 무관하다.
 * 예를 들어 쇼핑백 화면은 계속 `/cart`로 들어가지만 호출하는 API는
 * `/shopping-bag`이다.
 *
 * Azure SAS 업로드 URL은 등록하지 않는다. 서버가 응답으로 준 전체 URL을
 * 그대로 써야 하고, 우리 base URL과 아무 관계가 없다.
 */
export const API = {
  auth: {
    login: apiUrl('/auth/login'),
    signup: apiUrl('/auth/signup'),
    kakao: apiUrl('/auth/kakao'),
    profile: apiUrl('/auth/profile'),
  },
  user: {
    me: apiUrl('/users/me'),
    bodyImage: apiUrl('/users/me/body-image'),
  },
  product: {
    list: apiUrl('/products'),
    detail: (productId) => apiUrl(`/products/${productId}`),
  },
  wishlist: apiUrl('/wishlist'),
  wishlistItem: (productColorId) => apiUrl(`/wishlist/${productColorId}`),
  shoppingBag: apiUrl('/shopping-bag'),
  shoppingBagItem: (shoppingBagItemId) => apiUrl(`/shopping-bag/${shoppingBagItemId}`),
  survey: {
    questions: apiUrl('/surveys/questions'),
  },
  passport: {
    profile: apiUrl('/passport'),
    stamps: apiUrl('/passport/stamps'),
    credits: apiUrl('/passport/credits'),
    visit: (visitLogId) => apiUrl(`/passport/visits/${visitLogId}`),
  },
  boardingPass: {
    issue: apiUrl('/boarding-passes'),
    latest: apiUrl('/boarding-passes/latest'),
    scan: (boardingPassId) => apiUrl(`/boarding-passes/${boardingPassId}/scan`),
    route: (boardingPassId) => apiUrl(`/boarding-passes/${boardingPassId}/route`),
    complete: (boardingPassId) => apiUrl(`/boarding-passes/${boardingPassId}/complete`),
  },
  floor: {
    list: apiUrl('/floors'),
    detail: (floorId) => apiUrl(`/floors/${floorId}`),
  },
  fitting: {
    uploadUrl: apiUrl('/fitting-sessions/upload-url'),
    create: apiUrl('/fitting-sessions'),
    detail: (fittingSessionId) => apiUrl(`/fitting-sessions/${fittingSessionId}`),
  },
}
