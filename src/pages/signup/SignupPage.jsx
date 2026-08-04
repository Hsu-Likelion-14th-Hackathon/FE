import { useState } from 'react'
import { Link } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import calendarIcon from '@/assets/icons/auth/calendar.svg'
import chevronMutedIcon from '@/assets/icons/auth/chevron-muted.svg'
import chevronOpenIcon from '@/assets/icons/auth/chevron-open.svg'
import chevronSelectedIcon from '@/assets/icons/auth/chevron-selected.svg'
import mapPinActiveIcon from '@/assets/icons/auth/map-pin-active.svg'
import mapPinMutedIcon from '@/assets/icons/auth/map-pin-muted.svg'
import userIcon from '@/assets/icons/auth/user.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './SignupPage.module.scss'

const countries = [
  '대한민국 (Republic of Korea)',
  '뮌헨 (Munich)',
  '미국 (United States)',
  '중국 (China)',
  '일본 (Japan)',
]

function RequiredMark() {
  return (
    <>
      <span className={styles.required} aria-hidden="true">
        *
      </span>
      <span className={styles.visuallyHidden}>필수 입력</span>
    </>
  )
}

export function Component() {
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('')

  const activeCountry = selectedCountry || countries[0]
  const displayedCountry = isCountryOpen ? activeCountry : selectedCountry
  const hasActiveCountry = isCountryOpen || Boolean(selectedCountry)
  const countryChevron = isCountryOpen
    ? chevronOpenIcon
    : selectedCountry
      ? chevronSelectedIcon
      : chevronMutedIcon

  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setIsCountryOpen(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
  }

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

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="signup-name">
                <span>이름</span>
                <RequiredMark />
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

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="signup-birth-date">
                <span>생년월일</span>
                <RequiredMark />
              </label>
              <div className={styles.inputShell}>
                <img className={styles.controlIcon} src={calendarIcon} alt="" aria-hidden="true" />
                <input
                  className={styles.input}
                  id="signup-birth-date"
                  name="birthDate"
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  placeholder="생년월일을 입력해 주세요"
                  required
                />
                <img className={styles.chevron} src={chevronMutedIcon} alt="" aria-hidden="true" />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.label} id="nationality-label">
                <span>국적</span>
                <RequiredMark />
              </span>
              <button
                className={`${styles.countryButton} ${hasActiveCountry ? styles.countryButtonActive : ''}`}
                type="button"
                aria-labelledby="nationality-label nationality-value"
                aria-haspopup="listbox"
                aria-expanded={isCountryOpen}
                aria-controls="nationality-options"
                onClick={() => setIsCountryOpen((isOpen) => !isOpen)}
              >
                <img
                  className={styles.controlIcon}
                  src={hasActiveCountry ? mapPinActiveIcon : mapPinMutedIcon}
                  alt=""
                  aria-hidden="true"
                />
                <span
                  className={displayedCountry ? styles.countryValue : styles.countryPlaceholder}
                  id="nationality-value"
                  aria-live="polite"
                >
                  {displayedCountry || '국적을 입력해 주세요'}
                </span>
                <img className={styles.chevron} src={countryChevron} alt="" aria-hidden="true" />
              </button>
              <input type="hidden" name="nationality" value={selectedCountry} />
            </div>
          </div>

          {isCountryOpen ? (
            <div
              className={styles.countryOptions}
              id="nationality-options"
              role="listbox"
              aria-label="국적 선택"
            >
              {countries.map((country) => (
                <button
                  className={`${styles.countryOption} ${country === activeCountry ? styles.countryOptionSelected : ''}`}
                  key={country}
                  type="button"
                  role="option"
                  aria-selected={country === activeCountry}
                  onClick={() => handleCountrySelect(country)}
                >
                  {country}
                </button>
              ))}
            </div>
          ) : (
            <button className={styles.submitButton} type="submit">
              가입하기
            </button>
          )}
        </form>
      </section>
    </div>
  )
}
