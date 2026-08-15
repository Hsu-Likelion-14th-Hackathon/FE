import '@/styles/globals.scss'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

afterEach(cleanup)

/**
 * 테스트는 네트워크를 타면 안 된다.
 *
 * .env에 VITE_API_BASE_URL과 VITE_BEARER_TOKEN이 있으면 화면이 부르는 조회가
 * 실제 서버까지 나간다. 그러면 같은 코드인데도 .env를 둔 로컬과 없는 CI의 결과가
 * 갈리고, 남의 계정 상태나 회선에 따라 통과 여부가 바뀐다.
 *
 * 거부는 .env가 없는 환경에서 이미 일어나던 일이라 CI 결과는 그대로 두면서,
 * 로컬을 CI와 같은 조건으로 맞춘다. 특정 응답이 필요한 테스트는 자기 파일에서
 * vi.stubGlobal('fetch', ...)로 덮어쓰면 된다.
 */
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('테스트에서는 네트워크를 쓸 수 없다'))),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// jsdom에는 ResizeObserver가 없다. observeResize가 없는 환경도 견디도록
// 만들어져 있지만, 대부분의 테스트가 실제 브라우저와 같은 경로를 지나도록
// 여기서 대역을 심는다. 없을 때의 동작은 observe-resize.test.js가 따로 본다.
// jsdom은 레이아웃을 재지 않으므로 관측은 흉내만 내고, 콜백은 모아 둔다.
const resizeCallbacks = new Set()

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback
    }

    observe() {
      resizeCallbacks.add(this.callback)
    }

    unobserve() {
      resizeCallbacks.delete(this.callback)
    }

    disconnect() {
      resizeCallbacks.delete(this.callback)
    }
  }
}

/**
 * 화면 크기가 바뀐 것처럼 관측 콜백을 모두 부른다.
 *
 * jsdom은 레이아웃이 없어 실제 리사이즈가 일어나지 않는다. 크기 변화에
 * 반응해야 하는 코드를 검증하려면 이렇게 직접 깨워야 한다.
 */
export function triggerResize() {
  for (const callback of resizeCallbacks) callback([])
}
