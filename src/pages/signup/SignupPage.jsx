import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import userIcon from '@/assets/icons/auth/user.svg'
import { EMAIL_ALREADY_REGISTERED, createProfile, signup } from '@/shared/api/authApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import BirthDateField from '@/shared/ui/profile-fields/BirthDateField.jsx'
import NationalitySelect from '@/shared/ui/profile-fields/NationalitySelect.jsx'
import { getCountryOption } from '@/shared/ui/profile-fields/country-options.js'
import { PASSPORT_NAME_MAX_LENGTH, toPassportName } from '@/shared/lib/passportName.js'

import styles from './SignupPage.module.scss'

/**
 * 가입 실패 사유.
 *
 * 백엔드 message를 그대로 싣는다. 특히 이미 가입된 이메일이면 어느 방식으로
 * 로그인해야 하는지까지 담겨 오므로, 우리가 문구를 새로 지으면 실제 상황과
 * 어긋난다. 사라지는 토스트도 쓰지 않는다. 다시 읽을 방법이 없으면 그 안내가
 * 소용없어진다.
 */
function SignupError({ error }) {
  if (!error) return null

  return (
    <div className={styles.errorNotice} role="alert">
      <p className={styles.errorMessage}>
        {error.message || '가입하지 못했습니다. 잠시 후 다시 시도해 주세요.'}
      </p>
      {error.code === EMAIL_ALREADY_REGISTERED ? (
        // 카카오로 가입된 이메일이라 여기서는 더 갈 곳이 없다. 로그인 화면의
        // 카카오 버튼까지 한 번에 데려다준다.
        <Link className={styles.errorAction} to="/login">
          로그인 화면으로 이동
        </Link>
      ) : null}
    </div>
  )
}

/**
 * 회원가입.
 *
 * 두 단계다. 이메일·비밀번호로 계정을 만들고(POST /auth/signup), 이어서
 * 여권에 찍을 이름·생년월일·국적을 받는다(POST /auth/profile). 카카오로 새로
 * 가입한 사람도 두 번째 단계로 합류한다. 카카오는 인증만 맡아 그 세 값을
 * 주지 않는다.
 *
 * 한 route 안에서 단계를 바꾼다. 주소를 나누면 새로고침했을 때 계정만 만들고
 * 추가 정보가 없는 상태로 돌아올 길이 사라진다.
 */
export function Component() {
  const navigate = useNavigate()
  // 'account' → 'profile'
  const [step, setStep] = useState('account')
  const [submitting, setSubmitting] = useState(false)
  // 백엔드 message를 그대로 싣는다. 이미 가입된 이메일이면 어느 방식으로
  // 로그인해야 하는지까지 담겨 온다.
  const [error, setError] = useState(null)
  const [openPicker, setOpenPicker] = useState(null)
  const [name, setName] = useState('')
  // 걸러낸 글자가 있을 때만 안내를 띄운다. 처음부터 보여주면 잔소리가 된다.
  const [nameRejected, setNameRejected] = useState(false)
  // 한글은 ㅇ→아→안 처럼 조합을 거친다. 조합 중에 값을 바꾸면 IME가 이를
  // 되돌리므로(모바일 키보드에서 특히) 조합이 끝난 뒤에 걸러낸다.
  const composingRef = useRef(false)
  // 조합 중인 글자가 받을 수 없는 문자면 흐리게 보여 유효하지 않음을 드러낸다.
  const [nameBlocked, setNameBlocked] = useState(false)

  // 입력 경로가 onChange와 onCompositionEnd 둘이라 필터는 이 함수 하나로 모은다.
  // 같은 입력에 같은 결과를 내므로 두 경로가 겹쳐도 상태가 흔들리지 않는다.
  const handleNameInput = (raw) => {
    if (composingRef.current) {
      // 조합 중에는 IME가 값을 관리하도록 두고 화면만 따라간다.
      setName(raw)
      return
    }
    const next = toPassportName(raw)
    setNameRejected(next !== raw.toUpperCase())
    setName(next)
  }

  // 조합이 확정되기 전에도 받을 수 없는 글자면 바로 알린다.
  // 조합 중인 글자는 값에 남지 않으므로 event.data로만 판별할 수 있다.
  const handleNameComposing = (data) => {
    const blocked = Boolean(data) && toPassportName(data) !== data.toUpperCase()
    setNameBlocked(blocked)
    if (blocked) setNameRejected(true)
  }

  const [birthDate, setBirthDate] = useState('')
  const [countryCode, setCountryCode] = useState('')

  async function handleAccountSubmit(event) {
    // 막지 않으면 브라우저가 기본 GET 제출을 해서 비밀번호가 주소창과 방문
    // 기록에 평문으로 남는다.
    event.preventDefault()
    if (submitting) return

    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)

    try {
      await signup({ email: form.get('email'), password: form.get('password') })
      setStep('profile')
    } catch (signupError) {
      setError(signupError)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      await createProfile({
        name: toPassportName(name).trim(),
        birthDate,
        // 백엔드는 alpha-2를 받는다(추가 정보 입력 명세의 `예: KR`).
        nationality: getCountryOption(countryCode)?.code ?? '',
      })
      navigate('/', { replace: true })
    } catch (profileError) {
      setError(profileError)
    } finally {
      setSubmitting(false)
    }
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
            <p className={styles.description}>
              {step === 'account'
                ? '이미 계정이 있으신가요?'
                : '여권에 표기할 정보만 더 받으면 끝납니다.'}
            </p>
            {step === 'account' ? (
              <Link className={styles.textLink} to="/login">
                로그인
              </Link>
            ) : null}
          </div>
        </header>

        {step === 'account' ? (
          <form className={styles.form} onSubmit={handleAccountSubmit}>
            <div className={styles.fields}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-email">
                  <span>이메일 주소</span>
                  <span className={styles.required} aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">필수 입력</span>
                </label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="이메일 주소를 입력해 주세요"
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-password">
                  <span>비밀번호</span>
                  <span className={styles.required} aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">필수 입력</span>
                </label>
                <div className={styles.inputShell}>
                  <input
                    className={styles.input}
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="비밀번호를 입력해 주세요"
                    required
                  />
                </div>
              </div>
            </div>

            <SignupError error={error} />

            <button className={styles.submitButton} type="submit" disabled={submitting}>
              {submitting ? '확인 중…' : '다음'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleProfileSubmit}>
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
                    className={`${styles.input} ${nameBlocked ? styles.inputBlocked : ''}`}
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    autoCapitalize="characters"
                    // 여권 표기 한도. 없으면 넘긴 글자가 말없이 잘려 나간다.
                    maxLength={PASSPORT_NAME_MAX_LENGTH}
                    lang="en"
                    placeholder="영문 이름을 입력해 주세요"
                    aria-describedby="signup-name-hint"
                    value={name}
                    onChange={(event) => handleNameInput(event.target.value)}
                    onCompositionStart={(event) => {
                      composingRef.current = true
                      handleNameComposing(event.data)
                    }}
                    onCompositionUpdate={(event) => handleNameComposing(event.data)}
                    onCompositionEnd={(event) => {
                      composingRef.current = false
                      setNameBlocked(false)
                      // compositionend 뒤에 input이 오지 않는 브라우저가 있어 여기서도 확정한다.
                      handleNameInput(event.target.value)
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

            <SignupError error={error} />

            <button className={styles.submitButton} type="submit" disabled={submitting}>
              {submitting ? '가입 중…' : '가입하기'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
