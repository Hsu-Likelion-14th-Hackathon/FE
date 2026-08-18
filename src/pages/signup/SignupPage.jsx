import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import backIcon from '@/assets/icons/auth/back.svg'
import userIcon from '@/assets/icons/auth/user.svg'
import { EMAIL_ALREADY_REGISTERED, createProfile, signup } from '@/shared/api/authApi.js'
import { isProfilePending } from '@/shared/api/profilePending.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import SpaceGuardNotice from '@/shared/ui/space-guard/SpaceGuardNotice.jsx'
import { useSpaceGuard } from '@/shared/ui/space-guard/useSpaceGuard.js'

import BirthDateField from '@/shared/ui/profile-fields/BirthDateField.jsx'
import NationalitySelect from '@/shared/ui/profile-fields/NationalitySelect.jsx'
import { getCountryOption } from '@/shared/ui/profile-fields/country-options.js'
import { PASSPORT_NAME_MAX_LENGTH, toPassportName } from '@/shared/lib/passportName.js'
import { PASSWORD_RULES, isValidPassword } from '@/shared/lib/password.js'

import styles from './SignupPage.module.scss'

/**
 * 비밀번호 조건표.
 *
 * 다 치고 제출한 뒤에 "형식이 올바르지 않습니다"를 만나면 무엇이 모자란지
 * 몰라 찍어서 고치게 된다. 조건을 처음부터 펼쳐 두고 치는 동안 하나씩
 * 채워지는 것을 보여 준다.
 *
 * 통과 표시는 한 글자라도 친 뒤에 켠다. 빈 칸에 미충족 표시가 다섯 개 떠
 * 있으면 아직 아무것도 안 했는데 혼나는 화면처럼 보인다.
 */
function PasswordRules({ password, touched }) {
  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  const allMet = metCount === PASSWORD_RULES.length

  return (
    <div
      className={`${styles.passwordRules} ${touched && allMet ? styles.passwordRulesMet : ''}`}
      id="signup-password-rules"
    >
      <p className={styles.passwordRulesTitle}>
        <span>비밀번호 조건</span>
        {touched ? (
          <span className={styles.passwordRulesCount}>
            {metCount}/{PASSWORD_RULES.length}
          </span>
        ) : null}
      </p>
      <ul className={styles.passwordRuleList}>
        {PASSWORD_RULES.map((rule) => {
          const met = touched && rule.test(password)
          return (
            <li className={`${styles.passwordRule} ${met ? styles.ruleMet : ''}`} key={rule.id}>
              <span className={styles.ruleMark} aria-hidden="true">
                {met ? '✓' : ''}
              </span>
              <span>{rule.label}</span>
              {touched ? (
                <span className="sr-only">{met ? ' 충족함' : ' 아직 충족하지 않음'}</span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

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
  const location = useLocation()
  // 'account' → 'profile'
  // 카카오로 새로 가입한 사람은 계정이 이미 있으므로 두 번째 단계로 들어온다.
  // 카카오는 인증만 맡아 이름·생년월일·국적을 주지 않는다.
  // state 없이 다시 들어와도(프로필을 안 쓰고 이탈했다 돌아온 경우) 미완성
  // 표시가 켜져 있으면 계정 단계를 건너뛴다 — 계정은 이미 있다.
  const [step, setStep] = useState(() =>
    location.state?.step === 'profile' || isProfilePending() ? 'profile' : 'account',
  )
  const [submitting, setSubmitting] = useState(false)
  // 백엔드 message를 그대로 싣는다. 이미 가입된 이메일이면 어느 방식으로
  // 로그인해야 하는지까지 담겨 온다.
  const [error, setError] = useState(null)
  const [openPicker, setOpenPicker] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // 이메일·비밀번호에 공백은 유효하지 않다. 들어오는 순간 막고 이유를 알린다.
  const emailGuard = useSpaceGuard()
  const passwordGuard = useSpaceGuard()
  // 이미 쓰인 이메일이면 그 조합으로는 더 갈 곳이 없다. 다음 동작이 오면
  // 칸을 비워 새 이메일부터 치게 한다. 지우는 시점을 미루는 이유는, 실패하자마자
  // 비우면 사용자가 방금 무엇을 넣었는지 확인할 새가 없기 때문이다.
  const [resetArmed, setResetArmed] = useState(false)
  // 규칙은 처음부터 보여 주되, 통과 여부 표시는 한 글자라도 친 뒤에 켠다.
  // 빈 칸에 빨간 표시가 다섯 개 떠 있으면 혼내는 화면처럼 보인다.
  const [passwordTouched, setPasswordTouched] = useState(false)
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

    if (!isValidPassword(password)) {
      // 서버까지 갈 필요가 없다. 무엇이 모자란지는 아래 목록이 이미 보여 준다.
      setPasswordTouched(true)
      return
    }

    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)

    try {
      await signup({ email: form.get('email'), password: form.get('password') })
      setStep('profile')
    } catch (signupError) {
      setError(signupError)
      setResetArmed(true)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 실패를 한 번 보여 준 뒤, 다음 동작이 오면 계정 칸을 비운다.
   *
   * 이미 쓰인 이메일이라 같은 값으로는 다시 시도해도 결과가 같다. 지우고
   * 처음부터 치는 편이 고쳐 쓰는 것보다 빠르다.
   */
  function consumeReset() {
    if (!resetArmed) return
    setResetArmed(false)
    setEmail('')
    emailGuard.reset()
    setPassword('')
    passwordGuard.reset()
    setPasswordTouched(false)
    setError(null)
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
      // 보호 라우트나 카카오 콜백이 남긴 원래 자리로 돌아간다. 없으면 홈이다.
      // "이미 등록됨"(409)도 여기로 온다 — createProfile이 멱등 성공으로 삼킨다.
      navigate(location.state?.from ?? '/', { replace: true })
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
                : '여권에 표기할 정보를 기입해 주세요.'}
            </p>
            {step === 'account' ? (
              <Link className={styles.textLink} to="/login">
                로그인
              </Link>
            ) : null}
          </div>
        </header>

        {step === 'account' ? (
          // 화면 어디를 건드리든 다음 동작으로 본다. 캡처 단계에서 받아야
          // 입력칸을 눌러 초점이 들어가기 전에 비울 수 있다.
          <form
            className={styles.form}
            onSubmit={handleAccountSubmit}
            onPointerDownCapture={consumeReset}
            onKeyDownCapture={consumeReset}
          >
            <div className={styles.fields}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-email">
                  <span>이메일 주소</span>
                  <span className={styles.required} aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">필수 입력</span>
                  {/* 이메일 문제라 이메일 칸 옆에 붙인다. 다른 칸에 두면 어디를
                      고쳐야 하는지 눈으로도 스크린리더로도 알 수 없다. */}
                  {error ? (
                    <span className={styles.fieldError} id="signup-email-error" role="alert">
                      {error.message || '가입하지 못했습니다. 잠시 후 다시 시도해 주세요.'}
                    </span>
                  ) : null}
                </label>
                <div className={`${styles.inputShell} ${error ? styles.inputShellInvalid : ''}`}>
                  <input
                    className={styles.input}
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="이메일 주소를 입력해 주세요"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'signup-email-error' : undefined}
                    value={email}
                    onBeforeInput={emailGuard.onBeforeInput}
                    onChange={(event) => setEmail(emailGuard.sanitize(event.target.value))}
                    required
                  />
                </div>
                <SpaceGuardNotice show={emailGuard.rejected}>
                  이메일에는 공백을 입력할 수 없습니다
                </SpaceGuardNotice>
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
                    aria-describedby="signup-password-rules"
                    value={password}
                    // 공백은 가려진 채 입력되면 별표만 늘어 오타와 구분되지
                    // 않는다. 규칙표의 "공백 없이"는 붙여넣기 등 이 가드를
                    // 지나치는 경로의 뒷그물로 남는다.
                    onBeforeInput={passwordGuard.onBeforeInput}
                    onChange={(event) => {
                      setPassword(passwordGuard.sanitize(event.target.value))
                      setPasswordTouched(true)
                    }}
                    required
                  />
                </div>
                <SpaceGuardNotice show={passwordGuard.rejected}>
                  비밀번호에는 공백을 입력할 수 없습니다
                </SpaceGuardNotice>
                <PasswordRules password={password} touched={passwordTouched} />
              </div>
            </div>

            {error?.code === EMAIL_ALREADY_REGISTERED ? (
              <Link className={styles.errorAction} to="/login">
                로그인 화면으로 이동
              </Link>
            ) : null}

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
