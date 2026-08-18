import { useCallback, useEffect, useState } from 'react'

import { getMe } from '@/shared/api/authApi.js'
import { getPassport, getPassportStamps } from '@/shared/api/passportApi.js'
import { passportProfile, passportStamps } from '@/pages/boarding-pass/passport/passportData.js'

/**
 * 아직 여권을 만들지 않은 사용자(가입 2단계 미완). 화면은 목 데이터가 아니라
 * "여권 만들기" 안내를 보여야 한다.
 */
export const PASSPORT_NOT_FOUND = 'PASSPORT_NOT_FOUND'

const initialState = {
  status: 'loading',
  // 조회하는 동안 지면(캔버스)이 그릴 채움 값. 수정은 profileReady가 막는다.
  profile: passportProfile,
  stamps: passportStamps,
}

/**
 * 여권 신분면과 방문 스탬프를 불러온다.
 *
 * 실패는 두 갈래로 나눈다. 여권이 아직 없는 것(PASSPORT_NOT_FOUND)은 만들러
 * 가야 할 상태고, 그 밖의 실패(네트워크·서버)는 다시 시도할 상태다. 예전처럼
 * 채움 데이터로 덮으면 여권 없는 사용자가 남의 기록이 찍힌 여권을 보게 된다 —
 * 보호 라우트가 된 지금은 "로그인 없이 열람" 용도도 사라졌다.
 *
 * 조회가 성공했으면 방문 0회여도 받은 그대로 보여 준다 — 빈 여권을 채움
 * 스탬프로 메우면 방문한 적 없는 기록이 찍힌 여권이 된다.
 *
 * 방문 상세는 여기서 부르지 않는다. 마지막 면은 스탬프를 눌러야 열리고,
 * 어느 방문을 볼지는 그때 정해진다(PassportPage).
 *
 * status: 'loading' | 'success' | 'missing' | 'error'
 */
export function usePassport() {
  const [state, setState] = useState(initialState)
  // 재시도 = 효과를 처음부터 다시. 값은 의미가 없고 바뀌는 것만 쓴다.
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setState(initialState)
    setAttempt((current) => current + 1)
  }, [])

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
      .catch((cause) => {
        if (!alive) return
        setState({
          status: cause?.code === PASSPORT_NOT_FOUND ? 'missing' : 'error',
          profile: passportProfile,
          stamps: passportStamps,
        })
      })

    return () => {
      alive = false
    }
  }, [attempt])

  return { ...state, retry }
}
