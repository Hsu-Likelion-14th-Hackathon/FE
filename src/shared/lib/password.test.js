import { describe, expect, it } from 'vitest'

import { PASSWORD_RULES, findUnmetPasswordRules, isValidPassword } from './password.js'

const unmetIds = (value) => findUnmetPasswordRules(value).map((rule) => rule.id)

describe('비밀번호 규칙', () => {
  it('네 종류를 모두 갖추고 8자 이상이면 통과한다', () => {
    expect(isValidPassword('Passw0rd!')).toBe(true)
    expect(unmetIds('Passw0rd!')).toEqual([])
  })

  it('모자란 항목만 짚어 준다', () => {
    // "형식이 올바르지 않습니다"만 보여 주면 무엇이 모자란지 알 수 없다.
    expect(unmetIds('password')).toEqual(['uppercase', 'digit', 'special'])
    expect(unmetIds('PASSWORD1!')).toEqual(['lowercase'])
    expect(unmetIds('Pw1!')).toEqual(['length'])
    // 빈 값에는 공백도 없다 — no-space만은 처음부터 충족 상태로 보인다.
    expect(unmetIds('')).toEqual(
      PASSWORD_RULES.filter((rule) => rule.id !== 'no-space').map((rule) => rule.id),
    )
  })

  it('여덟 자를 채워도 종류가 빠지면 막는다', () => {
    expect(isValidPassword('abcdefgh')).toBe(false)
    expect(isValidPassword('Abcdefgh')).toBe(false)
    expect(isValidPassword('Abcdefg1')).toBe(false)
  })

  it('특수문자는 목록을 열거하지 않고 영문·숫자·공백이 아닌 글자로 본다', () => {
    // 목록으로 정하면 목록에 없는 기호를 쓴 사람이 이유도 모른 채 막힌다.
    for (const symbol of ['!', '@', '~', '£', '·', '<']) {
      expect(isValidPassword(`Passw0rd${symbol}`)).toBe(true)
    }
    // 공백은 특수문자로 치지 않는다. 눈에 보이지 않아 오타와 구분되지 않는다.
    expect(unmetIds('Passw0rd ')).toEqual(['special', 'no-space'])
  })

  it('공백이 들어가면 어디에 있든 막는다', () => {
    // 모바일 키보드가 자동완성 뒤에 붙이는 꼬리 공백이 흔하다. 가입은 되는데
    // 본인은 공백 없이 쳐서 로그인이 안 되는 잠금이 된다.
    expect(unmetIds('Passw0rd! ')).toEqual(['no-space'])
    expect(unmetIds(' Passw0rd!')).toEqual(['no-space'])
    expect(unmetIds('Pass w0rd!')).toEqual(['no-space'])
    expect(unmetIds('Pass\tw0rd!')).toEqual(['no-space'])
    expect(isValidPassword('Passw0rd!')).toBe(true)
  })

  it('값이 없어도 터지지 않는다', () => {
    expect(isValidPassword(null)).toBe(false)
    expect(isValidPassword(undefined)).toBe(false)
  })
})
