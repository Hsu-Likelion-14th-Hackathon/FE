import { subscribeAccessToken } from './authToken.js'
import { createStoredValue } from './storedValue.js'

/**
 * "프로필(여권 정보) 미완성" 표시.
 *
 * 계정 생성(POST /auth/signup)이나 카카오 신규 가입은 토큰부터 준다. 그 상태로
 * 프로필 입력 화면을 떠나면 "토큰은 있는데 여권 정보가 없는" 사용자가 되어,
 * 보호 구간의 화면마다 API가 제각각 실패한다. 이 표시가 켜져 있는 동안
 * ProtectedRoute가 가입 2단계로 돌려보낸다.
 *
 * 토큰과 같은 저장소(storedValue)를 쓴다 — 새로고침은 견디고, 탭을 닫으면
 * 함께 사라진다. 카카오 로그인이 이 값을 덮어쓰고, 세션 복원(useSession)이
 * 서버 프로필로 다시 맞춘다.
 */

const store = createStoredValue('mcm-profile-pending', {
  decode: (raw) => raw === '1',
  encode: (value) => (value ? '1' : null),
})

export function isProfilePending() {
  return store.get()
}

export function setProfilePending(next) {
  store.set(Boolean(next))
}

/** @returns 구독을 끊는 함수 */
export function subscribeProfilePending(listener) {
  return store.subscribe(listener)
}

// 토큰이 죽으면(로그아웃·401) 표시도 함께 걷는다. 남겨 두면 그 탭의
// /signup이 프로필 단계에 고정되어 — 계정 단계에 도달할 수 없어 — 새 계정을
// 만들 수 없게 된다. 다음 로그인은 어떤 경로든 이 값을 다시 정한다.
subscribeAccessToken((token) => {
  if (!token) setProfilePending(false)
})
