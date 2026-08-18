import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { getMe } from '@/shared/api/authApi.js'
import { clearAccessToken, getAccessToken, subscribeAccessToken } from '@/shared/api/authToken.js'
import {
  isProfilePending,
  setProfilePending,
  subscribeProfilePending,
} from '@/shared/api/profilePending.js'

/**
 * 로그인 상태와 회원 정보.
 *
 * 앱이 뜰 때 토큰이 있으면 /users/me로 누구인지 확인한다. 토큰만 보고 로그인
 * 됐다고 단정하면, 만료된 토큰을 들고 보호 화면에 들어갔다가 첫 요청에서
 * 튕겨 나온다.
 *
 * 토큰은 모듈 밖에 사는 값이라 구독해서 읽는다. apiFetch가 401에서 지우거나
 * 로그인이 새로 넣으면 그 즉시 이 훅이 다시 확인한다.
 *
 * status: 'loading' | 'authenticated' | 'guest'
 */
export function useSession() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null)
  // 미완성 표시가 바뀌면(가입 2단계 완료 등) 회원 정보를 다시 확인한다.
  // 이 구독이 없으면, 가입 전에 떠난 getMe가 완료 뒤에야 도착해 이름 없는
  // 옛 응답으로 표시를 되켤 수 있다 — 재확인이 그 스테일 요청을 끊는다.
  const profilePending = useSyncExternalStore(
    subscribeProfilePending,
    isProfilePending,
    () => false,
  )
  // 어느 토큰으로 확인을 마쳤는지 함께 들고 있어야 한다. 토큰만 바뀌고 회원
  // 정보가 그대로면 옛 사람의 정보를 새 토큰의 것으로 보게 된다.
  const [resolved, setResolved] = useState(null)

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    getMe({ signal: controller.signal })
      .then((member) => {
        // 미완성 표시는 sessionStorage라 탭을 닫으면 사라지고, 카카오 재로그인의
        // isNewUser는 유저 행 기준이라 프로필 미입력 이탈자를 못 잡을 수 있다.
        // 서버가 준 실제 프로필로 표시를 맞춘다 — 이름이 비어 있으면 가입
        // 2단계가 끝나지 않은 사람이다.
        setProfilePending(!member.name)
        setResolved({ token, member })
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        // 401이면 apiFetch가 이미 토큰을 지웠다. 그 밖의 실패(네트워크·5xx)로
        // 토큰까지 버리지는 않는다. 잠깐 끊긴 것뿐일 수 있다. 다만 누구인지
        // 모르는 채로 보호 화면을 열 수는 없으므로 게스트로 둔다.
        setResolved({ token, member: null })
      })

    return () => controller.abort()
    // 표시가 같은 값으로 다시 확인되면 set이 값 변화 없이 끝나므로(스토어의
    // 동등성 가드) 재조회가 한 번을 넘어 반복되지는 않는다.
  }, [token, profilePending])

  // 토큰이 없으면 확인할 것도 없다. 있는데 아직 답이 안 왔으면 확인 중이다.
  const status = !token
    ? 'guest'
    : resolved?.token !== token
      ? 'loading'
      : resolved.member
        ? 'authenticated'
        : 'guest'

  const signOut = useCallback(() => clearAccessToken(), [])

  return {
    status,
    member: status === 'authenticated' ? resolved.member : null,
    isAuthenticated: status === 'authenticated',
    isRestoring: status === 'loading',
    signOut,
  }
}
