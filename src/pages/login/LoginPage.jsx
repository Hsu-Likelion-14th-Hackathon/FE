import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import kakaoIcon from '@/assets/icons/auth/kakao.svg'
import { login } from '@/shared/api/authApi.js'
import { startKakaoLogin } from '@/shared/api/kakaoAuth.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './LoginPage.module.scss'

export function Component() {
  // 입력한 비밀번호를 눈으로 확인할 수 있게 한다. 오타로 막히는 일이 잦다.
  const [passwordVisible, setPasswordVisible] = useState(false)
  // 공백을 걷어냈을 때만 안내를 띄운다. 조용히 지우면 지운 적 없는 글자가
  // 사라진 것처럼 보인다.
  const [emailSpaceRejected, setEmailSpaceRejected] = useState(false)
  const [passwordSpaceRejected, setPasswordSpaceRejected] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // 백엔드가 준 message를 그대로 보여 준다. 우리가 지어내면 실제 이유와
  // 어긋난다(잘못된 비밀번호인지, 없는 계정인지).
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    // 막지 않으면 브라우저가 기본 GET 제출을 해서 비밀번호가 주소창과 방문
    // 기록에 평문으로 남는다.
    event.preventDefault()
    if (submitting) return

    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError('')

    try {
      await login({ email: form.get('email'), password: form.get('password') })
      // 보호 화면에서 밀려왔다면 원래 가려던 곳으로 돌려보낸다.
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (loginError) {
      setError(loginError.message || '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <StoreHeader />

      <section className={styles.main} aria-labelledby="login-title">
        <Link className={styles.backLink} to="/" aria-label="메인 화면으로 돌아가기">
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </Link>

        <header className={styles.intro}>
          <h1 className={styles.title} id="login-title">
            로그인
          </h1>
          <div className={styles.descriptionRow}>
            <p className={styles.description}>
              회원으로 가입하시면 빠르고 편리하게 이용하실 수 있습니다.
            </p>
            {/* 보호 라우트가 남긴 자리를 가입 흐름에도 잇는다. 끊으면 이메일로
                가입한 사람만 가입 후 홈에 떨어진다. */}
            <Link
              className={styles.textLink}
              to="/signup"
              state={{ from: location.state?.from ?? null }}
            >
              회원가입
            </Link>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.requiredNotice}>* 표시가 있는 모든 입력 항목은 필수입니다.</p>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="login-email">
              이메일 주소
              <span className={styles.requiredMark} aria-hidden="true">
                *
              </span>
            </label>
            <input
              className={styles.fieldInput}
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              // 이메일에 공백은 어차피 유효하지 않다. 치는 즉시 걷어내면
              // 붙여넣기의 꼬리 공백도 제출 전에 사라진다. 비제어 입력이라
              // 값을 자리에서 고친다.
              onChange={(event) => {
                const stripped = event.target.value.replace(/\s/g, '')
                setEmailSpaceRejected(stripped !== event.target.value)
                if (stripped !== event.target.value) event.target.value = stripped
              }}
              required
            />
            {emailSpaceRejected ? (
              <p className={styles.inputNotice} role="status">
                이메일에는 공백을 입력할 수 없습니다
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label className={styles.fieldLabel} htmlFor="login-password">
                비밀번호
                <span className={styles.requiredMark} aria-hidden="true">
                  *
                </span>
              </label>
              <button
                className={styles.revealButton}
                type="button"
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                {passwordVisible ? '숨김' : '표시'}
              </button>
            </div>
            <input
              className={styles.fieldInput}
              id="login-password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              // 가입이 비밀번호에 공백을 막으므로 공백이 든 비밀번호는 있을 수
              // 없다. 가려진 칸에서 별표만 늘어 오타와 구분되지 않으니 이메일과
              // 같은 결로 걷어내고 알린다.
              onChange={(event) => {
                const stripped = event.target.value.replace(/\s/g, '')
                setPasswordSpaceRejected(stripped !== event.target.value)
                if (stripped !== event.target.value) event.target.value = stripped
              }}
              required
            />
            {passwordSpaceRejected ? (
              <p className={styles.inputNotice} role="status">
                비밀번호에는 공백을 입력할 수 없습니다
              </p>
            ) : null}
          </div>

          {error ? (
            <p className={styles.errorNotice} role="alert">
              {error}
            </p>
          ) : null}

          <button className={styles.submitButton} type="submit" disabled={submitting}>
            {submitting ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <button
          className={styles.kakaoButton}
          type="button"
          onClick={() => {
            // 키가 없으면 갈 곳이 없다. 아무 일도 안 일어나면 고장으로 보이므로
            // 이유를 남긴다. 디자인에 있는 버튼이라 감추지는 않는다.
            if (!startKakaoLogin({ from: location.state?.from })) {
              setError('카카오 로그인이 아직 준비되지 않았습니다.')
            }
          }}
        >
          <img className={styles.kakaoIcon} src={kakaoIcon} alt="" aria-hidden="true" />
          <span>카카오로 로그인</span>
        </button>
      </section>
    </div>
  )
}
