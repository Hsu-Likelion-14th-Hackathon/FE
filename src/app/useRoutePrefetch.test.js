import { describe, expect, it, vi } from 'vitest'

import { prefetchNextRoutes, ROUTE_PREFETCH } from './useRoutePrefetch.js'

describe('prefetchNextRoutes', () => {
  it('지금 화면에 걸린 다음 화면 모듈과 이미지를 받는다', () => {
    const loadModule = vi.fn(() => Promise.resolve({}))
    const loadImage = vi.fn()

    prefetchNextRoutes('/boarding-pass/scan', {
      prefetch: { '/boarding-pass/scan': { modules: [loadModule], images: ['a.webp', 'b.webp'] } },
      loadImage,
    })

    expect(loadModule).toHaveBeenCalledTimes(1)
    expect(loadImage.mock.calls).toEqual([['a.webp'], ['b.webp']])
  })

  it('끝의 슬래시는 무시한다', () => {
    const loadModule = vi.fn(() => Promise.resolve({}))

    prefetchNextRoutes('/boarding-pass/', {
      prefetch: { '/boarding-pass': { modules: [loadModule], images: [] } },
      loadImage: vi.fn(),
    })

    expect(loadModule).toHaveBeenCalledTimes(1)
  })

  it('등록되지 않은 화면이면 아무것도 받지 않는다', () => {
    const loadImage = vi.fn()

    prefetchNextRoutes('/cart', { prefetch: ROUTE_PREFETCH, loadImage })

    expect(loadImage).not.toHaveBeenCalled()
  })

  it('모듈 받기가 실패해도 던지지 않는다', async () => {
    const failing = vi.fn(() => Promise.reject(new Error('offline')))

    expect(() =>
      prefetchNextRoutes('/x', {
        prefetch: { '/x': { modules: [failing], images: [] } },
        loadImage: vi.fn(),
      }),
    ).not.toThrow()
    await Promise.resolve()
  })

  it('여정 순서대로 다음 화면이 이어진다', () => {
    const journey = [
      '/boarding-pass',
      '/boarding-pass/intro',
      '/boarding-pass/survey',
      '/boarding-pass/complete',
      '/boarding-pass/scan',
      '/boarding-pass/flight',
    ]
    for (const path of journey) expect(ROUTE_PREFETCH[path]?.modules.length).toBeGreaterThan(0)
  })
})
