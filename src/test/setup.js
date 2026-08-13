import '@/styles/globals.scss'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom에는 ResizeObserver가 없다. 레이아웃을 실제로 재지 않으므로 관측은
// 비워 두고, 컴포넌트가 마운트되는 것만 보장한다. 크기에 따른 동작은
// getBoundingClientRect를 직접 흉내내는 테스트에서 따로 검증한다.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
