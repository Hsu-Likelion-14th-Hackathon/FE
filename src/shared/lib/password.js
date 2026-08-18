/**
 * 회원가입 비밀번호 규칙.
 *
 * 가입 화면에서만 쓴다. 로그인은 검사하지 않는다. 규칙이 바뀌기 전에 만든
 * 계정이 있으면 자기 비밀번호로 로그인조차 못 하게 된다.
 *
 * 규칙을 하나로 뭉뚱그리지 않고 항목별로 돌려준다. "형식이 올바르지 않습니다"만
 * 보여 주면 무엇이 모자란지 알 수 없어 사용자가 찍어서 고치게 된다.
 */

export const PASSWORD_MIN_LENGTH = 8

/** 화면에 그대로 띄우는 순서다. 위에서부터 확인하게 된다. */
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `${PASSWORD_MIN_LENGTH}자 이상`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'uppercase', label: '영문 대문자 1개 이상', test: (value) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: '영문 소문자 1개 이상', test: (value) => /[a-z]/.test(value) },
  { id: 'digit', label: '숫자 1개 이상', test: (value) => /\d/.test(value) },
  {
    id: 'special',
    label: '특수문자 1개 이상',
    // 영문·숫자·공백이 아닌 글자를 특수문자로 본다. 목록을 열거하면 목록에
    // 없는 기호를 쓴 사람이 이유도 모른 채 막힌다.
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
  {
    id: 'no-space',
    label: '공백 없이',
    // 공백은 눈에 보이지 않아 오타와 구분되지 않는다. 특히 모바일 키보드가
    // 자동완성 뒤에 붙이는 꼬리 공백은, 가입은 되는데 본인은 공백 없이 쳐서
    // 로그인이 안 되는 — 원인을 알 수 없는 잠금이 된다. 탭·줄바꿈도 같다.
    test: (value) => !/\s/.test(value),
  },
]

/**
 * 아직 만족하지 않은 규칙만 돌려준다. 빈 배열이면 쓸 수 있는 비밀번호다.
 *
 * @param {string} value
 */
export function findUnmetPasswordRules(value) {
  const password = String(value ?? '')
  return PASSWORD_RULES.filter((rule) => !rule.test(password))
}

/** @param {string} value */
export function isValidPassword(value) {
  return findUnmetPasswordRules(value).length === 0
}
