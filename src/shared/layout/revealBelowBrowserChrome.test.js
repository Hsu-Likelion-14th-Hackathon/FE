import { afterEach, describe, expect, it, vi } from 'vitest'

import revealBelowBrowserChrome from './revealBelowBrowserChrome.js'

describe('revealBelowBrowserChrome', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete window.visualViewport
  })

  it('화면 안에 있으면 스크롤하지 않는다', () => {
    const element = document.createElement('button')
    element.getBoundingClientRect = () => ({ bottom: 500 })
    window.visualViewport = { offsetTop: 0, height: 700 }
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    element.scrollIntoView = vi.fn()

    revealBelowBrowserChrome(element)

    expect(scrollBy).not.toHaveBeenCalled()
    expect(element.scrollIntoView).not.toHaveBeenCalled()
  })

  it('시각 뷰포트 아래에 있으면 창을 내려 버튼을 보이게 한다', () => {
    const element = document.createElement('button')
    element.getBoundingClientRect = () => ({ bottom: 820 })
    window.visualViewport = { offsetTop: 0, height: 700 }
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    element.scrollIntoView = vi.fn()

    revealBelowBrowserChrome(element)

    expect(scrollBy).toHaveBeenCalledWith({ top: 132, behavior: 'smooth' })
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      block: 'end',
      behavior: 'smooth',
      inline: 'nearest',
    })
  })
})
