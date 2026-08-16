import { beforeEach, describe, expect, test, vi } from 'vitest'

const { createRoot, render } = vi.hoisted(() => {
  const render = vi.fn()
  return { createRoot: vi.fn(() => ({ render })), render }
})

vi.mock('react-dom/client', () => ({ createRoot }))
vi.mock('@/app/router.jsx', () => ({ router: {} }))

describe('application startup', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  // 전 도메인이 실서버 연동을 마쳐 MSW 부트스트랩은 걷어냈다. 진입점은
  // 조건 없이 바로 그린다.
  test('루트를 바로 렌더한다', async () => {
    await import('./main.jsx')

    expect(createRoot).toHaveBeenCalledOnce()
    expect(render).toHaveBeenCalledOnce()
  })
})
