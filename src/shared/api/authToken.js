/**
 * 액세스 토큰 보관소.
 *
 * 로그인에 성공하면 여기에 담고, apiFetch가 요청마다 꺼내 쓴다. 아직 로그인
 * 화면이 API와 연결되지 않아, 개발 중에는 .env의 VITE_BEARER_TOKEN을 초기값으로
 * 쓴다.
 *
 * VITE_ 접두사가 붙은 값은 빌드 결과물에 그대로 박힌다. 즉 이 토큰은 브라우저에서
 * 읽을 수 있다. 개발용 테스트 토큰에만 쓰고 배포 환경에는 절대 넣지 않는다.
 */
let token = import.meta.env.VITE_BEARER_TOKEN ?? null

export function getAccessToken() {
  return token
}

export function setAccessToken(next) {
  token = next || null
}

export function clearAccessToken() {
  token = null
}
