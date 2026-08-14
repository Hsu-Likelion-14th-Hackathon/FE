import '@/styles/globals.scss'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

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
