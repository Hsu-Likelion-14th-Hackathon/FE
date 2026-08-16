/**
 * 액세스 토큰 보관소.
 *
 * 로그인에 성공하면 여기에 담고, apiFetch가 요청마다 꺼내 쓴다.
 *
 * sessionStorage에 함께 둔다. 메모리에만 두면 새로고침 한 번에 로그인이
 * 풀린다. localStorage가 아닌 이유는 탭을 닫으면 함께 사라지게 하기 위해서다.
 * refresh 토큰 계약이 없어 만료를 갱신할 방법이 없으므로, 오래 남겨 둘수록
 * 죽은 토큰을 들고 다니게 된다.
 *
 * 저장이 막힌 환경(사파리 비공개 모드 등)에서도 화면은 떠야 하므로 실패는
 * 삼키고 메모리만 쓴다.
 */

const STORAGE_KEY = 'mcm-access-token'

function readStored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(next) {
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, next)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장에 실패해도 이번 세션 동안 메모리 값으로 동작한다.
  }
}

let token = readStored()

/** 토큰이 바뀐 것을 알아야 하는 쪽(인증 UI)이 구독한다. */
const listeners = new Set()

function notify() {
  for (const listener of listeners) listener(token)
}

export function getAccessToken() {
  return token
}

export function setAccessToken(next) {
  const value = next || null
  if (value === token) return
  token = value
  writeStored(value)
  notify()
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
  listeners.add(listener)
  return () => listeners.delete(listener)
}
