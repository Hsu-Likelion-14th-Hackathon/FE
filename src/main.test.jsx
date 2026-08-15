import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { createRoot, render, start } = vi.hoisted(() => {
  const render = vi.fn()

  return {
    createRoot: vi.fn(() => ({ render })),
    render,
    start: vi.fn(),
  }
})

vi.mock('react-dom/client', () => ({ createRoot }))
vi.mock('@/app/router.jsx', () => ({ router: {} }))
vi.mock('@/mocks/browser.js', () => ({ worker: { start } }))

describe('application startup', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  test('starts MSW in development by default', async () => {
    vi.stubEnv('DEV', true)
    // 개발자의 .env에 VITE_ENABLE_MSW=false가 있으면 그 값을 그대로 읽어
    // "기본값"을 검증하지 못한다. 기본 상태를 여기서 못 박는다.
    vi.stubEnv('VITE_ENABLE_MSW', undefined)

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).toHaveBeenCalledOnce()
  })

  test('renders without starting the worker when MSW is disabled', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_ENABLE_MSW', 'false')

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).not.toHaveBeenCalled()
  })

  test('renders when starting MSW fails', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_ENABLE_MSW', undefined)
    const error = new Error('worker failed')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    start.mockRejectedValueOnce(error)

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith('MSW 시작 실패, 실제 API를 사용합니다.', error)
  })

  test('does not start MSW when development is disabled', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_ENABLE_MSW', 'true')

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).not.toHaveBeenCalled()
  })
})
