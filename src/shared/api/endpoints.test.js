import { expect, test, vi } from 'vitest'

test('base URL 끝의 슬래시를 제거해 API 경로를 결합한다', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  const { API } = await import('./endpoints.js')

  // 명세서 경로에는 /api 접두사가 없다.
  expect(API.session).toBe('https://api.example.test/session')
})
