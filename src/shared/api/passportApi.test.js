import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPassport, getPassportStamps, getVisitDetail } from './passportApi.js'

/**
 * 백엔드는 날짜를 하이픈(`2026-07-21`)으로 준다. 화면은 Figma 표기(`2026 07 21`)를
 * 그대로 그리므로 변환이 빠지면 여권에 하이픈이 그대로 찍힌다. 캔버스는 받은
 * 문자열을 그리기만 할 뿐 손대지 않으니 여기가 마지막 방어선이다.
 */
function respondWith(result) {
  // apiFetch는 Content-Type을 믿지 않고 text로 읽은 뒤 파싱한다. Swagger가
  // 모든 응답의 media type을 와일드카드로 선언해 헤더를 신뢰할 수 없어서다.
  const body = JSON.stringify({ isSuccess: true, code: 'COMMON200', result })
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(body),
  })
}

describe('passportApi 날짜 변환', () => {
  const realFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubGlobal('fetch', undefined)
  })

  afterEach(() => {
    globalThis.fetch = realFetch
    vi.restoreAllMocks()
  })

  it('신분면 생년월일과 발급일의 하이픈을 공백으로 바꾼다', async () => {
    globalThis.fetch = respondWith({
      passportNo: '0001',
      name: 'YEONJU LIM',
      nationality: 'republic of korea',
      birthDate: '2000-01-01',
      issuedOn: '2026-08-25',
      creditBalance: 100,
      totalVisitCount: 6,
    })

    const profile = await getPassport()

    expect(profile.birthDate).toBe('2000 01 01')
    expect(profile.issueDate).toBe('2026 08 25')
    expect(profile.nationality).toBe('REPUBLIC OF KOREA')
  })

  it('스탬프 날짜도 같은 표기로 맞춘다', async () => {
    globalThis.fetch = respondWith({
      totalVisitCount: 2,
      stamps: [
        { passportStampId: 1, visitLogId: 11, stampedOn: '2026-07-21' },
        // 시각까지 붙어 와도 앞 열 자리만 쓴다.
        { passportStampId: 2, visitLogId: 12, stampedOn: '2026-07-23T10:30:00Z' },
      ],
    })

    const { stamps, visits } = await getPassportStamps()

    expect(visits).toBe(2)
    expect(stamps.map((stamp) => stamp.date)).toEqual(['2026 07 21', '2026 07 23'])
    expect(stamps[0].id).toBe('stamp-1')
  })

  it('날짜가 비어 오면 빈 문자열로 둔다', async () => {
    globalThis.fetch = respondWith({
      passportNo: '0002',
      birthDate: null,
      issuedOn: undefined,
    })

    const profile = await getPassport()

    // null을 그대로 넘기면 캔버스가 'null'을 그린다.
    expect(profile.birthDate).toBe('')
    expect(profile.issueDate).toBe('')
  })

  it('방문 상세의 방문일도 변환한다', async () => {
    globalThis.fetch = respondWith({
      visitLogId: 11,
      storeName: 'MCM HAUS',
      scannedAt: '2026-07-27T14:05:00',
      stayMinutes: 46,
      travelHistory: [],
    })

    const detail = await getVisitDetail(11)

    expect(detail.visitedOn).toBe('2026 07 27')
  })
})
