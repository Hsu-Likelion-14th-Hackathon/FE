import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFittingSession,
  createUploadUrl,
  getFittingSession,
  uploadToAzure,
} from './fittingApi.js'

/**
 * 피팅 계약의 함정들.
 *
 *   - Azure 업로드는 우리 백엔드가 아니다. Bearer를 붙이면 오히려 거절된다.
 *   - fileKey를 빼는 것과 null로 보내는 것은 다르다. 빼야 기본 전신 이미지를 쓴다.
 */
function respondWith(result) {
  const body = JSON.stringify({ isSuccess: true, code: 'COMMON200', result })
  return vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(body) })
}

/** fetch에 실제로 나간 URL과 본문 */
function callOf(fetchMock) {
  const [url, init] = fetchMock.mock.calls[0]
  return { url, init, body: init.body ? JSON.parse(init.body) : null }
}

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.stubGlobal('fetch', undefined)
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('업로드 URL 발급', () => {
  it('파일 이름과 형식을 싣고, 만료 시간이 없으면 300초로 본다', async () => {
    const fetchMock = respondWith({ uploadUrl: 'https://blob/sas', fileKey: 'body/1.jpg' })
    globalThis.fetch = fetchMock

    const issued = await createUploadUrl({ fileName: 'me.jpg', contentType: 'image/jpeg' })

    expect(callOf(fetchMock).body).toEqual({ fileName: 'me.jpg', contentType: 'image/jpeg' })
    expect(issued).toEqual({ uploadUrl: 'https://blob/sas', fileKey: 'body/1.jpg', expiresIn: 300 })
  })
})

describe('Azure 업로드', () => {
  const file = new File(['jpeg-bytes'], 'me.jpg', { type: 'image/jpeg' })

  it('SAS URL로 파일 바이트를 그대로 PUT한다 — Bearer는 붙이지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    globalThis.fetch = fetchMock

    await uploadToAzure('https://blob/sas', file)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://blob/sas')
    expect(init.method).toBe('PUT')
    // FormData로 감싸면 Azure가 그 래퍼까지 파일로 저장한다.
    expect(init.body).toBe(file)
    expect(init.headers['x-ms-blob-type']).toBe('BlockBlob')
    expect(init.headers['Content-Type']).toBe('image/jpeg')
    // 인증은 URL 속 SAS가 맡는다. Bearer를 붙이면 InvalidAuthenticationInfo다.
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('형식 없는 파일은 octet-stream으로 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 })
    globalThis.fetch = fetchMock

    await uploadToAzure('https://blob/sas', new File(['x'], 'me'))

    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/octet-stream')
  })

  it('Azure가 거절하면 상태 코드를 담아 던진다', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 403 })

    await expect(uploadToAzure('https://blob/sas', file)).rejects.toThrow('(403)')
  })

  it('브라우저가 요청을 막으면(CORS) 사람이 읽을 문구로 바꾼다', async () => {
    // 원문은 'Failed to fetch' 한 줄이다. 그대로 보여 주면 무슨 말인지 알 수 없다.
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(uploadToAzure('https://blob/sas', file)).rejects.toThrow(
      '이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    )
  })
})

describe('피팅 세션', () => {
  it('사진을 골랐으면 fileKey까지 싣는다', async () => {
    const fetchMock = respondWith({ fittingSessionId: 11, status: 'PENDING', creditCost: 100 })
    globalThis.fetch = fetchMock

    const session = await createFittingSession({ productColorId: 2, fileKey: 'body/1.jpg' })

    expect(callOf(fetchMock).body).toEqual({ productColorId: 2, fileKey: 'body/1.jpg' })
    expect(session.fittingSessionId).toBe(11)
    expect(session.creditCost).toBe(100)
  })

  it('사진이 없으면 fileKey 자체를 보내지 않는다 — 기본 전신 이미지를 쓴다', async () => {
    // fileKey: null을 보내는 것과 다르다. 키가 있으면 백엔드가 그 값을 찾으려 든다.
    const fetchMock = respondWith({ fittingSessionId: 11 })
    globalThis.fetch = fetchMock

    await createFittingSession({ productColorId: 2 })

    expect(callOf(fetchMock).body).toEqual({ productColorId: 2 })
  })

  it('조회는 결과 이미지가 없으면 null, 상태가 없으면 PENDING으로 본다', async () => {
    globalThis.fetch = respondWith({ fittingSessionId: 11 })

    const session = await getFittingSession(11)

    expect(callOf(globalThis.fetch).url).toMatch(/\/fitting-sessions\/11$/)
    expect(session.status).toBe('PENDING')
    expect(session.resultImageUrl).toBeNull()
  })

  it('DONE 응답은 결과 이미지와 상품 정보를 그대로 옮긴다', async () => {
    globalThis.fetch = respondWith({
      fittingSessionId: 11,
      status: 'DONE',
      resultImageUrl: 'https://cdn/result.jpg',
      productColorId: 2,
      name: 'Diamant 참',
      price: 490000,
      thumbnailImageUrl: 'https://cdn/thumb.jpg',
    })

    const session = await getFittingSession(11)

    expect(session.status).toBe('DONE')
    expect(session.resultImageUrl).toBe('https://cdn/result.jpg')
    expect(session.name).toBe('Diamant 참')
  })
})
