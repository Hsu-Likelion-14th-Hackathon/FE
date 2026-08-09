import { useEffect, useState } from 'react'

import { getSession } from '@/shared/api/sessionApi.js'

/**
 * 세션 조회 훅. Mock 기본값은 로그인됨.
 * status: 'loading' | 'success' | 'error'
 */
export function useSession() {
  const [state, setState] = useState({ status: 'loading', session: null })

  useEffect(() => {
    let alive = true
    getSession()
      .then((session) => {
        if (alive) setState({ status: 'success', session })
      })
      .catch(() => {
        if (alive) setState({ status: 'error', session: null })
      })
    return () => {
      alive = false
    }
  }, [])

  return {
    ...state,
    isAuthenticated: state.session?.authenticated === true,
  }
}
