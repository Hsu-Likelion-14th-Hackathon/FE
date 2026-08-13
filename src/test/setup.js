import '@/styles/globals.scss'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom에는 ResizeObserver가 없다. observeResize가 없는 환경도 견디도록
// 만들어져 있지만, 대부분의 테스트가 실제 브라우저와 같은 경로를 지나도록
// 여기서 대역을 심는다. 없을 때의 동작은 observe-resize.test.js가 따로 본다.
// 레이아웃을 실제로 재지 않으므로 관측 자체는 비워 둔다.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
