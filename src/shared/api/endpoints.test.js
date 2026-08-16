import { afterEach, beforeEach, expect, test, vi } from 'vitest'

// endpoints.js는 import 시점에 env를 읽는다. 모듈 캐시를 비우지 않으면 두
// 번째 테스트부터는 첫 테스트의 env로 평가된 모듈을 그대로 받아, 스텁이
// 걸린 척만 하는 테스트가 된다.
beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

test('base URL 끝의 슬래시를 제거해 API 경로를 결합한다', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  const { API } = await import('./endpoints.js')

  // 명세서와 Swagger 경로에는 /api 접두사가 없다. 붙이면 전부 404가 난다.
  expect(API.passport.profile).toBe('https://api.example.test/passport')
  expect(API.user.me).toBe('https://api.example.test/users/me')
})

test('ID가 들어가는 경로를 만든다', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test')
  const { API } = await import('./endpoints.js')

  // 스캔은 보딩패스 ID를 body가 아니라 경로에 담는다.
  expect(API.boardingPass.scan(7)).toBe('https://api.example.test/boarding-passes/7/scan')
  expect(API.boardingPass.route(7)).toBe('https://api.example.test/boarding-passes/7/route')
  expect(API.wishlistItem(3)).toBe('https://api.example.test/wishlist/3')
  expect(API.shoppingBagItem(3)).toBe('https://api.example.test/shopping-bag/3')
})

test('명세에 없는 경로를 남겨 두지 않는다', async () => {
  const { API } = await import('./endpoints.js')

  // /session과 /cart는 Swagger 27개 경로에 없다. 실서버에서 404가 난다.
  expect(API.session).toBeUndefined()
  expect(API.cart).toBeUndefined()
  expect(API.shoppingBag).toContain('/shopping-bag')
})
