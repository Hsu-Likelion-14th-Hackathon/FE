import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getKakaoRedirectUri,
  isKakaoLoginReady,
  startKakaoLogin,
  takeKakaoReturnTo,
} from './kakaoAuth.js'

const RETURN_TO_KEY = 'mcm-kakao-return-to'

beforeEach(() => {
  sessionStorage.clear()
  // jsdom은 실제 페이지 이동을 못 해 콘솔에 오류만 남긴다. 시험에는 무해하다.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('카카오 로그인 준비', () => {
  it('되돌아올 주소는 현재 origin에서 만든다', () => {
    // 손으로 적어 두면 개발(localhost)과 배포(Vercel) 중 한쪽을 고칠 때 다른 쪽을 잊는다.
    expect(getKakaoRedirectUri()).toBe(`${window.location.origin}/auth/kakao/callback`)
  })

  it('REST API 키가 없으면 준비되지 않은 상태다', () => {
    vi.stubEnv('VITE_KAKAO_CLIENT_ID', '')
    expect(isKakaoLoginReady()).toBe(false)

    vi.stubEnv('VITE_KAKAO_CLIENT_ID', 'test-key')
    expect(isKakaoLoginReady()).toBe(true)
  })

  it('키가 없으면 이동하지 않고 false를 돌려준다', () => {
    // 버튼이 이 값을 보고 미리 비활성 안내를 할 수 있어야 한다.
    vi.stubEnv('VITE_KAKAO_CLIENT_ID', '')

    expect(startKakaoLogin({ from: '/wishlist' })).toBe(false)
    expect(sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
  })
})

describe('되돌아올 자리', () => {
  it('로그인을 시작하면 있던 자리를 남긴다', () => {
    // 카카오를 거치면 페이지가 통째로 새로 떠 라우터 state로는 못 들고 간다.
    vi.stubEnv('VITE_KAKAO_CLIENT_ID', 'test-key')

    expect(startKakaoLogin({ from: '/wishlist' })).toBe(true)
    expect(sessionStorage.getItem(RETURN_TO_KEY)).toBe('/wishlist')
  })

  it('자리 없이 시작하면 이전에 남긴 자리를 지운다', () => {
    // 지난번 자리가 남아 있으면 이번 로그인 뒤 엉뚱한 화면으로 돌아간다.
    vi.stubEnv('VITE_KAKAO_CLIENT_ID', 'test-key')
    sessionStorage.setItem(RETURN_TO_KEY, '/cart')

    startKakaoLogin()

    expect(sessionStorage.getItem(RETURN_TO_KEY)).toBeNull()
  })

  it('한 번 읽으면 지워진다', () => {
    sessionStorage.setItem(RETURN_TO_KEY, '/wishlist')

    expect(takeKakaoReturnTo()).toBe('/wishlist')
    // 새로고침 등으로 콜백이 다시 돌아도 같은 곳으로 또 보내지 않는다.
    expect(takeKakaoReturnTo()).toBeNull()
  })

  it('남긴 자리가 없으면 null이다', () => {
    expect(takeKakaoReturnTo()).toBeNull()
  })
})
