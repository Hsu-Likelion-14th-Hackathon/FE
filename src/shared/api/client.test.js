import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, getAccessToken, setAccessToken } from './authToken.js'
import { ApiError, apiFetch } from './client.js'

/**
 * fetch 대역.
 *
 * Swagger가 모든 응답의 media type을 와일드카드로 선언해 Content-Type을 믿을 수
 * 없다. apiFetch는 헤더를 보지 않고 text로 읽으므로 대역도 text만 준다.
 */
function respond({ ok = true, status = 200, body = '' } = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(body),
  })
}

const envelope = (result) => JSON.stringify({ isSuccess: true, code: 'COMMON200', result })

beforeEach(() => clearAccessToken())
afterEach(() => clearAccessToken())

describe('apiFetch', () => {
  it('토큰이 있으면 Authorization을 붙이고 없으면 붙이지 않는다', async () => {
    globalThis.fetch = respond({ body: envelope({}) })
    await apiFetch('/passport')
    expect(globalThis.fetch.mock.calls[0][1].headers).toBeUndefined()

    setAccessToken('token-value')
    await apiFetch('/passport')
    expect(globalThis.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer token-value')
  })

  it('공개 API에는 토큰을 붙이지 않는다', async () => {
    // Swagger는 전역 JWT를 31개 전체에 상속시켜 login/signup/kakao도 잠금으로
    // 표시하지만, 그 표기를 클라이언트 동작에 복제하지 않는다.
    setAccessToken('token-value')
    globalThis.fetch = respond({ body: envelope({}) })

    await apiFetch('/auth/login', { method: 'POST', body: { email: 'a' }, auth: false })

    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
    expect(globalThis.fetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
  })

  it('unwrap을 켜면 result만 돌려준다', async () => {
    globalThis.fetch = respond({ body: envelope({ passportNo: '0001' }) })

    expect(await apiFetch('/passport', { unwrap: true })).toEqual({ passportNo: '0001' })
    // 아직 옮기지 않은 호출부가 있어 기본값은 래퍼째다.
    expect(await apiFetch('/passport')).toEqual({
      isSuccess: true,
      code: 'COMMON200',
      result: { passportNo: '0001' },
    })
  })

  it('성공했는데 result가 없으면 계약 오류로 던진다', async () => {
    // 화면이 undefined를 조용히 표시하는 것보다 여기서 드러나는 편이 낫다.
    globalThis.fetch = respond({ body: JSON.stringify({ isSuccess: true }) })

    await expect(apiFetch('/passport', { unwrap: true })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'CONTRACT_ERROR',
    })
  })

  it('실패는 status와 백엔드 code·message를 함께 남긴다', async () => {
    globalThis.fetch = respond({
      ok: false,
      status: 409,
      body: JSON.stringify({ isSuccess: false, code: 'USER409', message: '이미 가입된 이메일' }),
    })

    const error = await apiFetch('/auth/signup', { method: 'POST' }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.code).toBe('USER409')
    expect(error.message).toBe('이미 가입된 이메일')
  })

  it('본문이 비었거나 JSON이 아니어도 status로 오류를 만든다', async () => {
    globalThis.fetch = respond({ ok: false, status: 500, body: '<html>oops</html>' })

    const error = await apiFetch('/passport').catch((e) => e)

    expect(error.status).toBe(500)
    expect(error.code).toBeNull()
  })

  it('401이면 토큰을 지운다', async () => {
    // 죽은 토큰을 계속 보내지 않게 하고, 구독 중인 화면도 미인증으로 바뀐다.
    setAccessToken('expired')
    globalThis.fetch = respond({ ok: false, status: 401, body: '' })

    await expect(apiFetch('/passport')).rejects.toBeInstanceOf(ApiError)
    expect(getAccessToken()).toBeNull()
  })

  it('notFoundAsNull은 404만 null로 바꾼다', async () => {
    globalThis.fetch = respond({ ok: false, status: 404, body: '' })
    expect(await apiFetch('/boarding-passes/latest', { notFoundAsNull: true })).toBeNull()

    globalThis.fetch = respond({ ok: false, status: 500, body: '' })
    await expect(apiFetch('/boarding-passes/latest', { notFoundAsNull: true })).rejects.toThrow()
  })

  it('빈 본문을 성공으로 받으면 null이다', async () => {
    // DELETE는 본문 없이 200만 오기도 한다.
    globalThis.fetch = respond({ status: 200, body: '' })

    expect(await apiFetch('/wishlist/1', { method: 'DELETE' })).toBeNull()
  })

  it('취소 신호를 그대로 전달한다', async () => {
    globalThis.fetch = respond({ body: envelope({}) })
    const controller = new AbortController()

    await apiFetch('/passport', { signal: controller.signal })

    expect(globalThis.fetch.mock.calls[0][1].signal).toBe(controller.signal)
  })
})
