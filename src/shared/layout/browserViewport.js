/**
 * 브라우저마다 다른 화면 높이·확대 동작을 앱 시작 때 한 번 맞춘다.
 *
 * 1) 인앱 브라우저(카카오톡·네이버·인스타그램 …)
 *    화면 높이는 --mcm-viewport-stable(100lvh, 툴바가 숨은 큰 화면)을 쓴다.
 *    사파리는 스크롤하면 툴바가 접히므로 그 기준이 맞지만, 인앱 브라우저는
 *    위아래 바가 늘 떠 있어 하단이 바 밑에 깔리고 인트로 아래에 흰 띠가
 *    생겼다. WKWebView는 lvh·dvh를 잘못 계산하는 일이 잦아(WebKit 255852)
 *    CSS 단위 대신 실제로 보이는 높이(innerHeight)를 재서 --mcm-app-height로
 *    넣는다. _tokens.scss가 html[data-inapp]에서 이 값을 화면 높이로 쓴다.
 *
 * 2) iOS 입력칸 자동 확대
 *    iOS는 글자가 16px보다 작은 입력칸에 포커스하면 화면을 확대하고, 확대가
 *    풀리지 않아 오른쪽이 잘린 채 남는다. 글자 크기는 Figma 값이라 그대로
 *    두고 viewport에 maximum-scale=1을 더한다. iOS는 이 값이 있어도 손가락
 *    확대는 막지 않고 자동 확대만 막는다. 안드로이드는 손가락 확대까지 막히므로
 *    iOS에서만 넣는다.
 */

const IN_APP_PATTERN =
  /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps|everytimeApp|BAND\//i

export function isInAppBrowser(userAgent) {
  return IN_APP_PATTERN.test(userAgent ?? '')
}

export function isIOS({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iP(hone|ad|od)/.test(userAgent)) return true
  // iPadOS 13+는 데스크톱 사파리처럼 Macintosh로 자신을 밝힌다.
  return /Mac/.test(platform) && maxTouchPoints > 1
}

export function withMaximumScale(content) {
  if (/maximum-scale\s*=/.test(content)) return content
  return `${content}, maximum-scale=1`
}

/**
 * @param {{ window?: Window, document?: Document }} [env] 테스트용 주입
 * @returns {() => void} 붙인 리스너를 떼는 함수
 */
export function installBrowserViewport({ window: win = window, document: doc = document } = {}) {
  const { navigator } = win
  const root = doc.documentElement
  const cleanups = []

  if (isIOS(navigator)) {
    const meta = doc.querySelector('meta[name="viewport"]')
    if (meta) meta.setAttribute('content', withMaximumScale(meta.getAttribute('content') ?? ''))
  }

  if (isInAppBrowser(navigator.userAgent)) {
    root.dataset.inapp = ''
    const update = () => {
      root.style.setProperty('--mcm-app-height', `${Math.round(win.innerHeight)}px`)
    }
    update()
    // 키보드가 열려도 innerHeight는 그대로라(visualViewport만 준다) 화면이
    // 줄었다 늘었다 하지 않는다. 회전·바 높이 변화만 따라간다.
    for (const type of ['resize', 'orientationchange', 'pageshow']) {
      win.addEventListener(type, update)
      cleanups.push(() => win.removeEventListener(type, update))
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}
