import { useEffect, useState } from 'react'

import { getPassport, getPassportStamps } from '@/shared/api/passportApi.js'
import { passportProfile, passportStamps } from '@/pages/boarding-pass/passport/passportData.js'

/**
 * 여권 신분면과 방문 스탬프를 불러온다.
 *
 * 백엔드가 아직 연동 전이라 실패하면 기존 고정 데이터로 떨어진다.
 * 연동이 끝나면 fallback만 걷어내면 된다.
 *
 * status: 'loading' | 'success' | 'fallback'
 */
export function usePassport() {
  const [state, setState] = useState({
    status: 'loading',
    profile: passportProfile,
    stamps: passportStamps,
  })

  useEffect(() => {
    let alive = true

    Promise.all([getPassport(), getPassportStamps()])
      .then(([profile, stampResult]) => {
        if (!alive) return
        setState({
          status: 'success',
          profile: { ...profile, visits: stampResult.visits || profile.visits },
          stamps: stampResult.stamps.length ? stampResult.stamps : passportStamps,
        })
      })
      .catch(() => {
        if (!alive) return
        setState({ status: 'fallback', profile: passportProfile, stamps: passportStamps })
      })

    return () => {
      alive = false
    }
  }, [])

  return state
}
