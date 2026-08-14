/**
 * 액세스 토큰 보관소.
 *
 * 로그인에 성공하면 여기에 담고, apiFetch가 요청마다 꺼내 쓴다. 아직 로그인
 * 화면이 API와 연결되지 않아, 개발 중에는 .env의 VITE_BEARER_TOKEN을 초기값으로
 * 쓴다.
 *
 * VITE_ 접두사가 붙은 값은 빌드 결과물에 그대로 박힌다. 그래서 개발 빌드에서만
 * 읽는다. 운영 빌드에서는 로그인으로 받은 토큰만 쓴다.
 */
// 개발 빌드에서만 읽는다. 조건 없이 두면 VITE_ 값이 운영 번들에 그대로 박혀
// 누구나 토큰을 꺼내 쓸 수 있다.
let token = import.meta.env.DEV ? (import.meta.env.VITE_BEARER_TOKEN ?? null) : null

export function getAccessToken() {
  return token
}

export function setAccessToken(next) {
  token = next || null
}

export function clearAccessToken() {
  token = null
}
