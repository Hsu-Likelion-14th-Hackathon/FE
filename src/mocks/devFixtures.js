/**
 * 개발용 fixture 스위치.
 * - ?auth=guest | authenticated : 세션 상태 (기본 authenticated — 해피패스 안정)
 * - ?bag=empty | filled : 위시리스트/장바구니 상태 (기본 filled)
 * - ?pass=current | none : 최근 BP 존재 여부 (기본 current). none이면 latest 404
 * 쿼리로 지정하면 localStorage에 유지되어 라우팅 이동 후에도 적용된다.
 */
const AUTH_STORAGE_KEY = 'mcm-dev-auth'
const BAG_STORAGE_KEY = 'mcm-dev-bag'
const PASS_STORAGE_KEY = 'mcm-dev-pass'

function readSwitch(param, storageKey, allowedValues) {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get(param)
    if (fromQuery && allowedValues.includes(fromQuery)) {
      window.localStorage.setItem(storageKey, fromQuery)
      return fromQuery
    }
    const stored = window.localStorage.getItem(storageKey)
    if (stored && allowedValues.includes(stored)) {
      return stored
    }
  } catch {
    // storage 접근 불가 환경이면 기본값 사용
  }
  return allowedValues[0]
}

export function getAuthFixture() {
  return readSwitch('auth', AUTH_STORAGE_KEY, ['authenticated', 'guest'])
}

export function getBagFixture() {
  return readSwitch('bag', BAG_STORAGE_KEY, ['filled', 'empty'])
}

export function getPassFixture() {
  return readSwitch('pass', PASS_STORAGE_KEY, ['current', 'none'])
}
