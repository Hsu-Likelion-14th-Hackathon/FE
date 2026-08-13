import { useRef, useState } from 'react'
import { Link } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import userIcon from '@/assets/icons/auth/user.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import BirthDateField from './components/BirthDateField.jsx'
import NationalitySelect from './components/NationalitySelect.jsx'
import styles from './SignupPage.module.scss'

/** 여권 표기와 맞추기 위해 영문 대문자만 남긴다. 한글은 애초에 들어오지 않는다. */
function toPassportName(value) {
  return value.replace(/[^A-Za-z\s'-]/g, '').toUpperCase()
}

export function Component() {
  const [openPicker, setOpenPicker] = useState(null)
  const [name, setName] = useState('')
  // 걸러낸 글자가 있을 때만 안내를 띄운다. 처음부터 보여주면 잔소리가 된다.
  const [nameRejected, setNameRejected] = useState(false)
  // 한글은 ㅇ→아→안 처럼 조합을 거친다. 조합 중에 값을 바꾸면 IME가 이를
  // 되돌리므로(모바일 키보드에서 특히) 조합이 끝난 뒤에 걸러낸다.
  const composingRef = useRef(false)

  const applyNameFilter = (raw) => {
    const next = toPassportName(raw)
    setNameRejected(next !== raw.toUpperCase())
    setName(next)
  }
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
                  autoCapitalize="characters"
                  lang="en"
                  placeholder="영문 이름을 입력해 주세요"
                  aria-describedby="signup-name-hint"
                  value={name}
                  onChange={(event) => {
                    if (composingRef.current) {
                      // 조합 중에는 IME가 값을 관리하도록 두고 화면만 따라간다.
                      setName(event.target.value)
                      return
                    }
                    applyNameFilter(event.target.value)
                  }}
                  onCompositionStart={() => {
                    composingRef.current = true
                  }}
                  onCompositionEnd={(event) => {
                    composingRef.current = false
                    applyNameFilter(event.target.value)
                  }}
                  required
                />
              </div>
              {nameRejected ? (
                <p className={styles.inputNotice} id="signup-name-hint" role="status">
                  여권 표기에 맞춰 영문만 입력할 수 있습니다
                </p>
              ) : (
                <p className="sr-only" id="signup-name-hint">
                  여권 표기에 맞춰 영문 대문자로만 입력됩니다. 한글은 입력할 수 없습니다.
                </p>
              )}
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
