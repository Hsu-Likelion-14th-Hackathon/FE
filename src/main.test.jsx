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
    start.mockRejectedValueOnce(new Error('worker failed'))

    await import('./main.jsx')

    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
  })
})
