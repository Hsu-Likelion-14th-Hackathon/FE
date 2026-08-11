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

  test('renders without starting the worker when MSW is disabled', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'false')

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).not.toHaveBeenCalled()
  })

  test('renders when starting MSW fails', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'true')
    const error = new Error('worker failed')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    start.mockRejectedValueOnce(error)

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith('MSW 시작 실패, 실제 API를 사용합니다.', error)
  })

  test.each([
    ['development is disabled', false, 'true'],
    ['the MSW flag is missing', true, undefined],
    ['the MSW flag differs in case', true, 'TRUE'],
  ])('does not start MSW when %s', async (_, dev, mswEnabled) => {
    vi.stubEnv('DEV', dev)
    vi.stubEnv('VITE_ENABLE_MSW', mswEnabled)

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(start).not.toHaveBeenCalled()
  })
})
