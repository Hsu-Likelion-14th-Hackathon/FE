import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createProfile,
  deleteBodyImage,
  getMe,
  login,
  loginWithKakao,
  registerBodyImage,
  signup,
  updateMe,
} from './authApi.js'
import { clearAccessToken, getAccessToken } from './authToken.js'

function respond(result, { ok = true, status = 200 } = {}) {
  const body = JSON.stringify({ isSuccess: ok, code: 'COMMON200', message: '실패 사유', result })
  return vi.fn().mockResolvedValue({ ok, status, text: () => Promise.resolve(body) })
}

beforeEach(() => clearAccessToken())
afterEach(() => {
  clearAccessToken()
  vi.restoreAllMocks()
})

describe('authApi', () => {
  it('로그인에 성공하면 토큰을 보관소에 넣는다', async () => {
    // 화면마다 따로 저장하면 한 곳만 빠뜨려도 다음 요청이 익명으로 나간다.
    globalThis.fetch = respond({ accessToken: 'issued-token', userId: 7 })

    const session = await login({ email: 'a@b.c', password: 'pw' })

    expect(session.userId).toBe(7)
    expect(getAccessToken()).toBe('issued-token')
  })

  it('로그인 요청에는 토큰을 붙이지 않는다', async () => {
    globalThis.fetch = respond({ accessToken: 'issued-token' })

    await login({ email: 'a@b.c', password: 'pw' })

    // 아직 토큰이 없는 사람이 부르는 요청이다.
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('로그인에 실패하면 백엔드 message를 그대로 올린다', async () => {
    globalThis.fetch = respond(null, { ok: false, status: 401 })

    await expect(login({ email: 'a@b.c', password: 'pw' })).rejects.toMatchObject({
      status: 401,
      message: '실패 사유',
    })
    expect(getAccessToken()).toBeNull()
  })

  it('가입 1단계도 토큰을 보관소에 넣는다 — 이어지는 추가 정보 요청이 쓴다', async () => {
    // 가입 직후 POST /auth/profile이 바로 나간다. 토큰이 없으면 401로 끊긴다.
    globalThis.fetch = respond({ accessToken: 'signup-token', userId: 8 })

    const session = await signup({ email: 'a@b.c', password: 'pw' })

    expect(session.userId).toBe(8)
    expect(getAccessToken()).toBe('signup-token')
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('카카오 교환은 code와 redirectUri를 싣고, 신규 여부는 true일 때만 믿는다', async () => {
    // isNewUser가 빠진 응답을 신규로 보면 기존 회원이 추가 정보 화면으로 밀린다.
    globalThis.fetch = respond({ accessToken: 'kakao-token', userId: 9 })

    const session = await loginWithKakao({ code: 'auth-code', redirectUri: 'https://app/cb' })

    const [, init] = globalThis.fetch.mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({ code: 'auth-code', redirectUri: 'https://app/cb' })
    expect(init.headers.Authorization).toBeUndefined()
    expect(session.isNewUser).toBe(false)
    expect(getAccessToken()).toBe('kakao-token')
  })

  it('회원 정보의 국적은 대문자, 생년월일은 지면 표기로 옮긴다', async () => {
    globalThis.fetch = respond({
      userId: 7,
      name: 'YEONJU LIM',
      email: 'a@b.c',
      provider: 'LOCAL',
      nationality: 'kr',
      birthDate: '2000-01-01',
    })

    const me = await getMe()

    expect(me.nationality).toBe('KR')
    expect(me.birthDate).toBe('2000 01 01')
    expect(me.provider).toBe('LOCAL')
  })

  it('추가 정보와 회원 정보 수정은 세 필드를 함께 보낸다', async () => {
    // PATCH지만 UserUpdateRequest는 셋 다 필수라 부분 수정이 아니다.
    globalThis.fetch = respond({ userId: 7, name: 'A', nationality: 'KR', birthDate: '2000-01-01' })
    await updateMe({ name: 'A', birthDate: '2000-01-01', nationality: 'KR' })

    const [, init] = globalThis.fetch.mock.calls[0]
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({
      name: 'A',
      birthDate: '2000-01-01',
      nationality: 'KR',
    })

    globalThis.fetch = respond({ userId: 7, name: 'A', nationality: 'KR', birthDate: '2000-01-01' })
    await createProfile({ name: 'A', birthDate: '2000-01-01', nationality: 'KR' })
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('POST')
  })

  it('기본 전신 이미지는 피팅 업로드의 fileKey를 그대로 등록한다', async () => {
    // 전용 업로드 경로가 없다. 업로드는 한 번, fileKey를 두 곳(피팅·등록)이 나눠 쓴다.
    globalThis.fetch = respond({ bodyImageUrl: 'https://blob/body.jpg' })

    const saved = await registerBodyImage('body/1.jpg')

    const [, init] = globalThis.fetch.mock.calls[0]
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ fileKey: 'body/1.jpg' })
    expect(saved.bodyImageUrl).toBe('https://blob/body.jpg')
  })

  it('기본 전신 이미지 삭제는 deleted 여부를 불리언으로 돌려준다', async () => {
    globalThis.fetch = respond({ deleted: true })
    await expect(deleteBodyImage()).resolves.toEqual({ deleted: true })

    // 지울 것이 없던 응답도 화면이 분기할 수 있어야 한다.
    globalThis.fetch = respond({})
    await expect(deleteBodyImage()).resolves.toEqual({ deleted: false })
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('DELETE')
  })
})
