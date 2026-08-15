import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { EMAIL_ALREADY_REGISTERED, loginWithKakao } from '@/shared/api/authApi.js'
import { getKakaoRedirectUri, takeKakaoReturnTo } from '@/shared/api/kakaoAuth.js'

import styles from './KakaoCallbackPage.module.scss'

/**
 * 카카오가 되돌려 보낸 자리.
 *
 * 주소에 붙어 온 `code`를 백엔드에 넘겨 토큰을 받는다. 신규 가입이면 이름·
 * 생년월일·국적을 더 받아야 한다. 카카오는 인증만 맡아 그 세 값을 주지 않는다.
 *
 * 사용자가 볼 화면은 아니고 지나가는 자리다. 그래도 빈 화면을 두면 느린
 * 회선에서 멈춘 것처럼 보이므로 상태를 적어 둔다.
 */
export function Component() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  // 주소만 보고 알 수 있는 실패는 상태로 둘 필요가 없다. 그릴 때 계산한다.
  const [exchangeError, setExchangeError] = useState(null)
  // React 18 StrictMode는 효과를 두 번 실행한다. code는 한 번만 쓸 수 있어
  // 두 번째 호출이 KOE320으로 실패한다.
  const startedRef = useRef(false)

  const code = params.get('code')
  const kakaoError = params.get('error_description') ?? params.get('error')
  const paramError = kakaoError
    ? new Error(kakaoError)
    : code
      ? null
      : new Error('카카오에서 인증 정보를 받지 못했습니다.')
  const error = paramError ?? exchangeError
  // Error 객체는 그릴 때마다 새로 만들어진다. 효과는 있고 없고만 알면 된다.
  const blocked = Boolean(paramError)

  useEffect(() => {
    if (blocked || startedRef.current) return
    startedRef.current = true

    loginWithKakao({ code, redirectUri: getKakaoRedirectUri() })
      .then((session) => {
        const returnTo = takeKakaoReturnTo()
        if (session.isNewUser) {
          // 일반 가입의 2단계와 같은 화면이다.
          navigate('/signup', { replace: true, state: { step: 'profile' } })
          return
        }
        navigate(returnTo ?? '/', { replace: true })
      })
      .catch(setExchangeError)
  }, [blocked, code, navigate])

  if (!error) {
    return (
      <main className={styles.page}>
        <p className={styles.status} role="status">
          카카오 계정을 확인하고 있습니다…
        </p>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <p className={styles.error} role="alert">
        {error.message || '카카오 로그인에 실패했습니다.'}
      </p>
      {/* 이미 다른 방식으로 가입된 이메일이면 그쪽으로 가야 한다. 백엔드
          메시지가 어느 쪽인지 알려 주므로 갈 곳만 열어 준다. */}
      <button className={styles.retry} type="button" onClick={() => navigate('/login')}>
        {error.code === EMAIL_ALREADY_REGISTERED ? '로그인 화면으로' : '다시 시도'}
      </button>
    </main>
  )
}
