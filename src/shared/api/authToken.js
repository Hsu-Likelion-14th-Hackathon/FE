import { createStoredValue } from './storedValue.js'

/**
 * 액세스 토큰 보관소.
 *
 * 로그인에 성공하면 여기에 담고, apiFetch가 요청마다 꺼내 쓴다.
 *
 * sessionStorage에 함께 둔다(storedValue). refresh 토큰 계약이 없어 만료를
 * 갱신할 방법이 없으므로, 오래 남겨 둘수록 죽은 토큰을 들고 다니게 된다 —
 * 탭을 닫으면 함께 사라지는 편이 낫다.
 */

const store = createStoredValue('mcm-access-token')

export function getAccessToken() {
  return store.get()
}

export function setAccessToken(next) {
  store.set(next || null)
}

export function clearAccessToken() {
  setAccessToken(null)
}

/**
 * 토큰 변화를 구독한다.
 *
 * apiFetch가 401에서 토큰을 지우면 화면도 즉시 미인증으로 바뀌어야 한다.
 * 공유 API 계층은 라우터를 모르므로, 어디로 보낼지는 구독하는 쪽이 정한다.
 *
 * @returns 구독을 끊는 함수
 */
export function subscribeAccessToken(listener) {
  return store.subscribe(listener)
}
