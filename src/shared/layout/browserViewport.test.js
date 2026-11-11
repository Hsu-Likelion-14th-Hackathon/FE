import { afterEach, describe, expect, it } from 'vitest'

import {
  installBrowserViewport,
  isInAppBrowser,
  isIOS,
  withMaximumScale,
} from './browserViewport.js'

const KAKAO_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.9.0'
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'

function fakeWindow({ userAgent, platform = '', maxTouchPoints = 0, innerHeight = 655 }) {
  const listeners = {}
  return {
    navigator: { userAgent, platform, maxTouchPoints },
    innerHeight,
    addEventListener: (type, fn) => (listeners[type] = fn),
    removeEventListener: (type) => delete listeners[type],
    fire: (type) => listeners[type]?.(),
    listeners,
  }
}

function setViewportMeta(content) {
  document.head.innerHTML = `<meta name="viewport" content="${content}">`
}

afterEach(() => {
  document.head.innerHTML = ''
  delete document.documentElement.dataset.inapp
  document.documentElement.style.removeProperty('--mcm-app-height')
})

describe('browserViewport', () => {
  it('인앱 브라우저를 가린다', () => {
    expect(isInAppBrowser(KAKAO_IOS)).toBe(true)
    expect(isInAppBrowser(SAFARI_IOS)).toBe(false)
    expect(isInAppBrowser(CHROME_ANDROID)).toBe(false)
  })

  it('iPadOS가 Macintosh로 자신을 밝혀도 iOS로 본다', () => {
    expect(isIOS({ userAgent: SAFARI_IOS })).toBe(true)
    expect(
      isIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }),
    ).toBe(true)
    expect(
      isIOS({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }),
    ).toBe(false)
  })

  it('maximum-scale은 한 번만 더한다', () => {
    expect(withMaximumScale('width=device-width')).toBe('width=device-width, maximum-scale=1')
    expect(withMaximumScale('width=device-width, maximum-scale=2')).toBe(
      'width=device-width, maximum-scale=2',
    )
  })

  it('카카오톡에서는 보이는 높이를 화면 높이로 넣고 크기 변화를 따라간다', () => {
    setViewportMeta('width=device-width, initial-scale=1')
    const win = fakeWindow({ userAgent: KAKAO_IOS, innerHeight: 655 })

    const cleanup = installBrowserViewport({ window: win, document })
    const root = document.documentElement

    expect(root.dataset.inapp).toBe('')
    expect(root.style.getPropertyValue('--mcm-app-height')).toBe('655px')

    win.innerHeight = 700
    win.fire('resize')
    expect(root.style.getPropertyValue('--mcm-app-height')).toBe('700px')

    cleanup()
    expect(Object.keys(win.listeners)).toHaveLength(0)
  })

  it('iOS에서만 입력칸 자동 확대를 막는다', () => {
    setViewportMeta('width=device-width, initial-scale=1')
    installBrowserViewport({ window: fakeWindow({ userAgent: SAFARI_IOS }), document })
    expect(document.querySelector('meta').getAttribute('content')).toContain('maximum-scale=1')

    setViewportMeta('width=device-width, initial-scale=1')
    installBrowserViewport({ window: fakeWindow({ userAgent: CHROME_ANDROID }), document })
    expect(document.querySelector('meta').getAttribute('content')).not.toContain('maximum-scale')
  })

  it('일반 브라우저에서는 화면 높이를 건드리지 않는다', () => {
    installBrowserViewport({ window: fakeWindow({ userAgent: SAFARI_IOS }), document })
    expect(document.documentElement.dataset.inapp).toBeUndefined()
  })
})
