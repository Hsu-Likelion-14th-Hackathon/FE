import { useState } from 'react'
import { Link } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import userIcon from '@/assets/icons/auth/user.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import BirthDateField from './components/BirthDateField.jsx'
import NationalitySelect from './components/NationalitySelect.jsx'
import styles from './SignupPage.module.scss'

export function Component() {
  const [openPicker, setOpenPicker] = useState(null)
  const [birthDate, setBirthDate] = useState('')
  const [countryCode, setCountryCode] = useState('')

  return (
    <div className={styles.page}>
      <StoreHeader />

      <section className={styles.main} aria-labelledby="signup-title">
        <Link className={styles.backLink} to="/login" aria-label="로그인 화면으로 돌아가기">
          <img className={styles.backIcon} src={backIcon} alt="" aria-hidden="true" />
        </Link>

        <header className={styles.intro}>
          <h1 className={styles.title} id="signup-title">
            회원가입
          </h1>
          <div className={styles.descriptionRow}>
            <p className={styles.description}>이미 계정이 있으신가요?</p>
            <Link className={styles.textLink} to="/login">
              로그인
            </Link>
          </div>
        </header>

        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="signup-name">
                <span>이름</span>
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
                <span className="sr-only">필수 입력</span>
              </label>
              <div className={styles.inputShell}>
                <span className={styles.userIconBox} aria-hidden="true">
                  <img className={styles.userIcon} src={userIcon} alt="" />
                </span>
                <input
                  className={styles.input}
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="이름을 입력해 주세요"
                  required
                />
              </div>
            </div>

            <BirthDateField
              value={birthDate}
              onChange={setBirthDate}
              isOpen={openPicker === 'birthDate'}
              onOpenChange={(isOpen) => setOpenPicker(isOpen ? 'birthDate' : null)}
            />

            <NationalitySelect
              value={countryCode}
              onChange={setCountryCode}
              isOpen={openPicker === 'nationality'}
              onOpenChange={(isOpen) => setOpenPicker(isOpen ? 'nationality' : null)}
            />
          </div>

          <button className={styles.submitButton} type="submit">
            가입하기
          </button>
        </form>
      </section>
    </div>
  )
}
