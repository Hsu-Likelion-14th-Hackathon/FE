import { describe, expect, it } from 'vitest'

import { countryOptions, findCountryByStoredValue, getCountryOption } from './country-options.js'

/**
 * 이 표는 손으로 관리하는 249줄짜리 데이터다. 한 줄이라도 칸이 비면 그 나라를
 * 고른 사람만 국적이 빈 값으로 저장되고, 화면에서는 아무 일도 없어 보인다.
 * 실제로 영국·홍콩·마카오를 포함한 26개 줄에서 alpha3가 빠져 있었다.
 * 눈으로 훑어서는 못 잡으므로 불변식으로 못 박는다.
 */
describe('countryOptions 불변식', () => {
  it('모든 나라가 여섯 칸을 빠짐없이 채운다', () => {
    const incomplete = countryOptions.filter(
      (country) =>
        !country.code ||
        !country.nativeName ||
        !country.englishName ||
        !country.apiValue ||
        !country.koreanName ||
        !country.alpha3,
    )

    expect(incomplete.map((country) => country.code)).toEqual([])
  })

  it('국가 코드는 alpha-2 두 자리, alpha-3 세 자리 대문자다', () => {
    const malformed = countryOptions.filter(
      (country) => !/^[A-Z]{2}$/.test(country.code) || !/^[A-Z]{3}$/.test(country.alpha3),
    )

    expect(malformed.map((country) => `${country.code}/${country.alpha3}`)).toEqual([])
  })

  it('코드가 겹치지 않는다', () => {
    // 겹치면 되찾기 표에서 한쪽이 다른 나라를 가리킨다.
    expect(new Set(countryOptions.map((country) => country.code)).size).toBe(countryOptions.length)
    expect(new Set(countryOptions.map((country) => country.alpha3)).size).toBe(
      countryOptions.length,
    )
  })

  it('저장된 값이 어떤 표기로 와도 같은 나라를 찾는다', () => {
    const korea = getCountryOption('KR')

    // 백엔드가 주는 alpha-2, 지면에 찍는 alpha-3, 예전에 저장됐을 공식 국명.
    expect(findCountryByStoredValue('KR')).toBe(korea)
    expect(findCountryByStoredValue('KOR')).toBe(korea)
    expect(findCountryByStoredValue('REPUBLIC OF KOREA')).toBe(korea)
    expect(findCountryByStoredValue('kr')).toBe(korea)
  })

  it('모르는 값과 빈 값에는 아무 나라도 주지 않는다', () => {
    expect(findCountryByStoredValue('ZZZ')).toBeNull()
    expect(findCountryByStoredValue('')).toBeNull()
    expect(findCountryByStoredValue(null)).toBeNull()
    expect(findCountryByStoredValue(undefined)).toBeNull()
  })

  it('예전에 alpha3가 비어 있던 나라들도 이제 값을 갖는다', () => {
    // 회귀 방지. 이 목록이 다시 비면 그 나라를 고른 사용자만 국적을 잃는다.
    for (const code of ['GB', 'HK', 'MO', 'BA', 'TT', 'PG']) {
      expect(getCountryOption(code)?.alpha3).toMatch(/^[A-Z]{3}$/)
    }
  })
})
