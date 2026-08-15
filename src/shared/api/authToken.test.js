import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  subscribeAccessToken,
} from './authToken.js'

const STORAGE_KEY = 'mcm-access-token'

beforeEach(() => {
  clearAccessToken()
  sessionStorage.clear()
})

afterEach(() => {
  clearAccessToken()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('authToken', () => {
  it('토큰을 sessionStorage에도 남겨 새로고침을 견딘다', () => {
    // 메모리에만 두면 새로고침 한 번에 로그인이 풀린다.
    setAccessToken('token-value')

    expect(getAccessToken()).toBe('token-value')
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('token-value')
  })

  it('지우면 저장소에서도 사라진다', () => {
    setAccessToken('token-value')
    clearAccessToken()

    expect(getAccessToken()).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('빈 값은 없는 것으로 본다', () => {
    setAccessToken('token-value')
    setAccessToken('')

    expect(getAccessToken()).toBeNull()
  })

  it('바뀐 것을 구독한 쪽에 알린다', () => {
    // apiFetch가 401에서 토큰을 지우면 인증 UI도 즉시 미인증으로 바뀌어야 한다.
    const seen = []
    const unsubscribe = subscribeAccessToken((token) => seen.push(token))

    setAccessToken('token-value')
    clearAccessToken()
    unsubscribe()
    setAccessToken('after-unsubscribe')

    expect(seen).toEqual(['token-value', null])
  })

  it('같은 값으로 다시 넣으면 알리지 않는다', () => {
    setAccessToken('token-value')
    const seen = []
    subscribeAccessToken((token) => seen.push(token))

    setAccessToken('token-value')

    expect(seen).toEqual([])
  })

  it('저장이 막힌 환경에서도 메모리로 동작한다', () => {
    // 사파리 비공개 모드처럼 sessionStorage가 던지는 곳이 있다. 화면은 떠야 한다.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(() => setAccessToken('token-value')).not.toThrow()
    expect(getAccessToken()).toBe('token-value')
  })
})
