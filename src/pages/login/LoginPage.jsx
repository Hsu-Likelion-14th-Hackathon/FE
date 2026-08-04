import { Link } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import kakaoIcon from '@/assets/icons/auth/kakao.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './LoginPage.module.scss'

export function Component() {
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

        <button className={styles.kakaoButton} type="button">
          <img className={styles.kakaoIcon} src={kakaoIcon} alt="" aria-hidden="true" />
          <span>카카오로 로그인</span>
        </button>
      </section>
    </div>
  )
}
