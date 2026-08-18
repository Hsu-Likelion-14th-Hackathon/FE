import { useSyncExternalStore } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { getAccessToken, subscribeAccessToken } from '@/shared/api/authToken.js'
import { isProfilePending, subscribeProfilePending } from '@/shared/api/profilePending.js'

/**
 * 로그인해야 여는 라우트 묶음.
 *
 * 토큰이 있는지만 본다. 진짜 살아 있는 토큰인지는 화면의 첫 API 호출이
 * 검사한다 — 401이면 apiFetch가 토큰을 지우고, 여기의 구독이 그 즉시
 * 로그인으로 돌려보낸다. 여기서 /users/me까지 확인하면 보호 화면에 들어갈
 * 때마다 왕복이 하나 늘고, 그 사이 보여 줄 것도 없다.
 *
 * 토큰이 있어도 프로필(여권 정보)이 미완성이면 가입 2단계로 보낸다. 가입
 * 1단계나 카카오 신규 가입이 토큰부터 주므로, 프로필 화면에서 이탈한
 * 사용자를 막지 않으면 보호 구간의 화면마다 API가 제각각 실패한다. 이
 * 판별도 저장소 표시(profilePending)라 왕복이 없다.
 *
 * 로그인 페이지는 state.from으로 돌아올 곳을 받는다(카카오 경유 포함).
 */
export function ProtectedRoute() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null)
  const profilePending = useSyncExternalStore(
    subscribeProfilePending,
    isProfilePending,
    () => false,
  )
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (profilePending) {
    return (
      <Navigate
        to="/signup"
        replace
        state={{ step: 'profile', from: location.pathname + location.search }}
      />
    )
  }

  return <Outlet />
}
