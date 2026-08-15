import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import kakaoIcon from '@/assets/icons/auth/kakao.svg'
import { login } from '@/shared/api/authApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './LoginPage.module.scss'

export function Component() {
  // 입력한 비밀번호를 눈으로 확인할 수 있게 한다. 오타로 막히는 일이 잦다.
  const [passwordVisible, setPasswordVisible] = useState(false)
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
            <Link className={styles.textLink} to="/signup">
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
              required
            />
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
              required
            />
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

        <button className={styles.kakaoButton} type="button">
          <img className={styles.kakaoIcon} src={kakaoIcon} alt="" aria-hidden="true" />
          <span>카카오로 로그인</span>
        </button>
      </section>
    </div>
  )
}
