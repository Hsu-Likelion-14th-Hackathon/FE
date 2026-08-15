import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { getMe } from '@/shared/api/authApi.js'
import { clearAccessToken, getAccessToken, subscribeAccessToken } from '@/shared/api/authToken.js'

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
  // 어느 토큰으로 확인을 마쳤는지 함께 들고 있어야 한다. 토큰만 바뀌고 회원
  // 정보가 그대로면 옛 사람의 정보를 새 토큰의 것으로 보게 된다.
  const [resolved, setResolved] = useState(null)

  useEffect(() => {
    if (!token) return undefined

    const controller = new AbortController()

    getMe({ signal: controller.signal })
      .then((member) => setResolved({ token, member }))
      .catch((error) => {
        if (error?.name === 'AbortError') return
        // 401이면 apiFetch가 이미 토큰을 지웠다. 그 밖의 실패(네트워크·5xx)로
        // 토큰까지 버리지는 않는다. 잠깐 끊긴 것뿐일 수 있다. 다만 누구인지
        // 모르는 채로 보호 화면을 열 수는 없으므로 게스트로 둔다.
        setResolved({ token, member: null })
      })

    return () => controller.abort()
  }, [token])

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
