import { useEffect, useState } from 'react'

import { getMe } from '@/shared/api/authApi.js'
import { getPassport, getPassportStamps } from '@/shared/api/passportApi.js'
import { passportProfile, passportStamps } from '@/pages/boarding-pass/passport/passportData.js'

/**
 * 여권 신분면과 방문 스탬프를 불러온다.
 *
 * 로그인 없이도 여권을 열람할 수 있어야 하므로, 조회에 실패하면 채움
 * 데이터로 떨어진다. 조회가 성공했으면 방문 0회여도 받은 그대로 보여 준다 —
 * 빈 여권을 채움 스탬프로 메우면 방문한 적 없는 기록이 찍힌 여권이 된다.
 *
 * 방문 상세는 여기서 부르지 않는다. 마지막 면은 스탬프를 눌러야 열리고,
 * 어느 방문을 볼지는 그때 정해진다(PassportPage).
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

    // 생년월일은 여권 응답(PassportResponse)에 없다. /users/me에만 있어 함께
    // 묶되, 이쪽 실패로 여권 전체를 잃지는 않는다.
    Promise.all([getPassport(), getPassportStamps(), getMe().catch(() => null)])
      .then(([profile, stampResult, me]) => {
        if (!alive) return
        setState({
          status: 'success',
          profile: {
            ...profile,
            birthDate: me?.birthDate || profile.birthDate,
            visits: stampResult.visits ?? profile.visits,
          },
          stamps: stampResult.stamps,
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
