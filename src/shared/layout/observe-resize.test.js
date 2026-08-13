import { afterEach, describe, expect, it, vi } from 'vitest'

import observeResize from './observe-resize.js'

const nativeResizeObserver = globalThis.ResizeObserver

afterEach(() => {
  globalThis.ResizeObserver = nativeResizeObserver
})

describe('observeResize', () => {
  it('ResizeObserver가 있으면 요소를 관찰하고, 정리하면 끊는다', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    globalThis.ResizeObserver = class {
      observe = observe
      disconnect = disconnect
      unobserve() {}
    }

    const element = document.createElement('div')
    const stop = observeResize(element, () => {})

    expect(observe).toHaveBeenCalledWith(element)
    stop()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('ResizeObserver가 없는 웹뷰에서는 창 크기 변화로 대신한다', () => {
    globalThis.ResizeObserver = undefined
    const onResize = vi.fn()

    const stop = observeResize(document.createElement('div'), onResize)

    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('orientationchange'))
    expect(onResize).toHaveBeenCalledTimes(2)

    // 정리한 뒤에는 더 불리지 않아야 한다.
    stop()
    window.dispatchEvent(new Event('resize'))
    expect(onResize).toHaveBeenCalledTimes(2)
  })
})
