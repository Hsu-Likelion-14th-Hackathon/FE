/**
 * 카카오 인증 화면으로 보내는 쪽.
 *
 * 카카오는 우리에게 비밀번호를 주지 않는다. 사용자가 카카오에서 인증하면
 * 등록된 주소로 `code`만 붙여 되돌려 보내고, 그 code를 백엔드에 넘기면
 * 토큰이 나온다(POST /auth/kakao).
 *
 * 여기 쓰이는 REST API 키는 공개 값이라 번들에 박혀도 된다. 비밀 키는
 * 백엔드만 갖는다.
 */

const AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize'

/** 카카오가 code를 붙여 돌려보낼 우리 주소. 라우터의 콜백 경로와 같아야 한다. */
export const KAKAO_CALLBACK_PATH = '/auth/kakao/callback'

/**
 * 콘솔에 등록한 주소와 **글자 하나까지** 같아야 한다. 다르면 KOE006이 난다.
 *
 * origin에서 만들어 쓴다. 개발(localhost)과 배포(Vercel)가 서로 다른 주소를
 * 쓰는데, 손으로 적어 두면 한쪽을 고칠 때 다른 쪽을 잊는다. 대신 두 주소를
 * 모두 콘솔에 등록해야 한다.
 */
export function getKakaoRedirectUri() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${KAKAO_CALLBACK_PATH}`
}

/** 키가 없으면 버튼을 눌러도 갈 곳이 없다. 화면이 미리 알 수 있게 드러낸다. */
export function isKakaoLoginReady() {
  return Boolean(import.meta.env.VITE_KAKAO_CLIENT_ID)
}

/**
 * 카카오 인증 화면으로 이동한다.
 *
 * 되돌아올 곳을 sessionStorage에 남긴다. 카카오를 거치면 페이지가 통째로
 * 새로 뜨므로 라우터 state로는 들고 갈 수 없다.
 */
export function startKakaoLogin({ from } = {}) {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID
  if (!clientId) return false

  try {
    if (from) sessionStorage.setItem(RETURN_TO_KEY, from)
    else sessionStorage.removeItem(RETURN_TO_KEY)
  } catch {
    // 저장이 막힌 환경이면 로그인 뒤 홈으로 간다. 로그인 자체는 막지 않는다.
  }

  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', getKakaoRedirectUri())
  url.searchParams.set('response_type', 'code')
  window.location.assign(url.toString())
  return true
}

const RETURN_TO_KEY = 'mcm-kakao-return-to'

/** 카카오를 거치기 전에 있던 자리. 한 번 읽으면 지운다. */
export function takeKakaoReturnTo() {
  try {
    const value = sessionStorage.getItem(RETURN_TO_KEY)
    sessionStorage.removeItem(RETURN_TO_KEY)
    return value || null
  } catch {
    return null
  }
}
