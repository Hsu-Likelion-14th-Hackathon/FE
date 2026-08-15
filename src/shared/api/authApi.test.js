import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createProfile, getMe, login, updateMe } from './authApi.js'
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
})
