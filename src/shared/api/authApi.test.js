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
import { clearAccessToken, getAccessToken, setAccessToken } from './authToken.js'
import { isProfilePending, setProfilePending } from './profilePending.js'

function respond(result, { ok = true, status = 200 } = {}) {
  const body = JSON.stringify({ isSuccess: ok, code: 'COMMON200', message: '실패 사유', result })
  return vi.fn().mockResolvedValue({ ok, status, text: () => Promise.resolve(body) })
}

beforeEach(() => {
  clearAccessToken()
  setProfilePending(false)
})
afterEach(() => {
  clearAccessToken()
  setProfilePending(false)
  vi.restoreAllMocks()
})

describe('authApi', () => {
  it('로그인에 성공하면 토큰을 보관소에 넣고, 미완성 표시는 건드리지 않는다', async () => {
    // 화면마다 따로 저장하면 한 곳만 빠뜨려도 다음 요청이 익명으로 나간다.
    globalThis.fetch = respond({ accessToken: 'issued-token', userId: 7 })
    // 가입 1단계만 한 계정도 로그인은 된다 — 여기서 표시를 걷으면 그 계정이
    // 프로필 가드를 지나친다. 진짜 상태는 세션 복원(useSession)이 맞춘다.
    setProfilePending(true)

    const session = await login({ email: 'a@b.c', password: 'pw' })

    expect(session.userId).toBe(7)
    expect(getAccessToken()).toBe('issued-token')
    expect(isProfilePending()).toBe(true)
  })

  it('토큰이 죽으면(로그아웃·401) 미완성 표시도 함께 걷는다', () => {
    // 남겨 두면 그 탭의 /signup이 프로필 단계에 고정되어 새 계정을 만들 수 없다.
    globalThis.fetch = respond({})
    setAccessToken('live-token')
    setProfilePending(true)

    clearAccessToken()

    expect(isProfilePending()).toBe(false)
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
    // 토큰만 있고 여권 정보는 아직이다 — 보호 구간이 가입 2단계로 돌려보내는 근거.
    expect(isProfilePending()).toBe(true)
  })

  it('카카오 교환은 code와 redirectUri를 싣고, 신규 여부는 true일 때만 믿는다', async () => {
    // isNewUser가 빠진 응답을 신규로 보면 기존 회원이 추가 정보 화면으로 밀린다.
    globalThis.fetch = respond({ accessToken: 'kakao-token', userId: 9 })
    // 기존 회원 로그인은 지난 계정이 남긴 미완성 표시도 걷어낸다.
    setProfilePending(true)

    const session = await loginWithKakao({ code: 'auth-code', redirectUri: 'https://app/cb' })

    const [, init] = globalThis.fetch.mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({ code: 'auth-code', redirectUri: 'https://app/cb' })
    expect(init.headers.Authorization).toBeUndefined()
    expect(session.isNewUser).toBe(false)
    expect(getAccessToken()).toBe('kakao-token')
    expect(isProfilePending()).toBe(false)
  })

  it('카카오 신규 가입은 미완성 표시를 켠다 — 프로필을 안 쓰고 떠나도 잡을 수 있게', async () => {
    globalThis.fetch = respond({ accessToken: 'kakao-token', userId: 9, isNewUser: true })

    const session = await loginWithKakao({ code: 'auth-code', redirectUri: 'https://app/cb' })

    expect(session.isNewUser).toBe(true)
    expect(isProfilePending()).toBe(true)
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
    // 가입 1단계가 켠 표시를 여기서 끈다 — 여권 정보까지 들어가야 가입 완료다.
    setProfilePending(true)
    await createProfile({ name: 'A', birthDate: '2000-01-01', nationality: 'KR' })
    expect(globalThis.fetch.mock.calls[0][1].method).toBe('POST')
    expect(isProfilePending()).toBe(false)
  })

  it('이미 등록된 회원의 추가 정보 409는 멱등 성공으로 삼키고 표시를 끈다', async () => {
    // 실패 코드지만 뜻은 "가입이 끝나 있다"이다. 오류로 올리면 호출부마다
    // 코드를 대조해야 하고, 하나만 빠져도 성공 상태가 오류 화면으로 남는다.
    const body = JSON.stringify({
      isSuccess: false,
      code: 'PROFILE_ALREADY_REGISTERED',
      message: '이미 추가 정보가 등록된 회원입니다.',
    })
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 409, text: () => Promise.resolve(body) })
    setProfilePending(true)

    await expect(
      createProfile({ name: 'A', birthDate: '2000-01-01', nationality: 'KR' }),
    ).resolves.toBeNull()
    expect(isProfilePending()).toBe(false)
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
