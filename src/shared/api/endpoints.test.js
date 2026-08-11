import { expect, test, vi } from 'vitest'

test('base URL 끝의 슬래시를 제거해 API 경로를 결합한다', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  const { API } = await import('./endpoints.js')

  expect(API.session).toBe('https://api.example.test/api/session')
})
