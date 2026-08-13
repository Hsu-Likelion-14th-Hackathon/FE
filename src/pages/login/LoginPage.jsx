import { useState } from 'react'
import { Link } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import kakaoIcon from '@/assets/icons/auth/kakao.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './LoginPage.module.scss'

export function Component() {
  // 입력한 비밀번호를 눈으로 확인할 수 있게 한다. 오타로 막히는 일이 잦다.
  const [passwordVisible, setPasswordVisible] = useState(false)

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

        <form
          className={styles.form}
          onSubmit={(event) => {
            // 아직 붙일 API가 없다. 막지 않으면 브라우저가 기본 동작으로 GET
            // 제출을 해서 페이지가 새로고침되고 비밀번호가 주소창과 방문 기록에
            // 평문으로 남는다. POST /auth/login을 붙일 때 이 자리를 채운다.
            event.preventDefault()
          }}
        >
          <p className={styles.requiredNotice}>* 표시가 있는 모든 입력 항목은 필수입니다.</p>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="login-email">
              이메일 주소<span aria-hidden="true">*</span>
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
                비밀번호<span aria-hidden="true">*</span>
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

          <button className={styles.submitButton} type="submit">
            로그인
          </button>
        </form>

        <hr className={styles.divider} />

        <button className={styles.kakaoButton} type="button">
          <img className={styles.kakaoIcon} src={kakaoIcon} alt="" aria-hidden="true" />
          <span>카카오 로그인</span>
        </button>
      </section>
    </div>
  )
}
