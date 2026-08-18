/**
 * "프로필(여권 정보) 미완성" 표시.
 *
 * 계정 생성(POST /auth/signup)이나 카카오 신규 가입은 토큰부터 준다. 그 상태로
 * 프로필 입력 화면을 떠나면 "토큰은 있는데 여권 정보가 없는" 사용자가 되어,
 * 보호 구간의 화면마다 API가 제각각 실패한다. 이 표시가 켜져 있는 동안
 * ProtectedRoute가 가입 2단계로 돌려보낸다.
 *
 * 토큰과 같은 이유로 sessionStorage다 — 새로고침은 견디고, 탭을 닫으면
 * 함께 사라진다. 모든 로그인 경로(login/signup/kakao)가 이 값을 덮어쓰므로
 * 다른 계정으로 갈아타도 지난 계정의 표시가 남지 않는다.
 */

const STORAGE_KEY = 'mcm-profile-pending'

function readStored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeStored(next) {
  try {
    if (next) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장이 막힌 환경이면 이번 세션 동안 메모리 값으로 동작한다.
  }
}

let pending = readStored()

/** 표시가 바뀐 것을 알아야 하는 쪽(ProtectedRoute)이 구독한다. */
const listeners = new Set()

function notify() {
  for (const listener of listeners) listener(pending)
}

export function isProfilePending() {
  return pending
}

export function setProfilePending(next) {
  const value = Boolean(next)
  if (value === pending) return
  pending = value
  writeStored(value)
  notify()
}

/** @returns 구독을 끊는 함수 */
export function subscribeProfilePending(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
