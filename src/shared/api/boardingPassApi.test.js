import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  completeBoardingPass,
  getBoardingPassRoute,
  getLatestBoardingPass,
  getSurveyQuestions,
  issueBoardingPass,
  scanBoardingPass,
} from './boardingPassApi.js'

/**
 * 설문·보딩패스 계약의 함정들.
 *
 *   - 편명·좌석·게이트는 백엔드가 주지 않는다(연출 값). 실값만 응답에서 온다.
 *   - 설문 옵션 순서는 배열 순서가 아니라 orderNo가 정한다.
 *   - 스캔의 storeId는 선택이라, 없으면 본문 자체를 보내지 않는다.
 */
function respondWith(result, { ok = true, status = 200 } = {}) {
  const body = JSON.stringify({ isSuccess: ok, code: 'COMMON200', message: '실패 사유', result })
  return vi.fn().mockResolvedValue({ ok, status, text: () => Promise.resolve(body) })
}

/** fetch에 실제로 나간 URL과 본문 */
function callOf(fetchMock) {
  const [url, init] = fetchMock.mock.calls[0]
  return { url, method: init.method, body: init.body ? JSON.parse(init.body) : null }
}

const realFetch = globalThis.fetch

beforeEach(() => {
  vi.stubGlobal('fetch', undefined)
})

afterEach(() => {
  globalThis.fetch = realFetch
  vi.restoreAllMocks()
})

describe('설문', () => {
  it('문항과 옵션을 orderNo 순서로 화면 모양에 맞춘다', async () => {
    globalThis.fetch = respondWith({
      questions: [
        {
          surveyQuestionId: 3,
          stepNo: 1,
          content: '오늘의 방문 목적은?',
          questionType: 'SINGLE_SELECT',
          isRequired: true,
          // 배열은 뒤죽박죽으로 온다. orderNo가 진짜 순서다.
          options: [
            { surveyOptionId: 32, orderNo: 2, label: '선물', description: '누군가를 위해' },
            { surveyOptionId: 31, orderNo: 1, label: '구경', description: '나를 위해' },
          ],
        },
        { surveyQuestionId: 9, stepNo: 6, content: '남기고 싶은 말', questionType: 'TEXT' },
      ],
    })

    const questions = await getSurveyQuestions()

    expect(questions[0].id).toBe(3)
    expect(questions[0].label).toBe('Q1')
    expect(questions[0].isRequired).toBe(true)
    expect(questions[0].options.map((option) => option.id)).toEqual([31, 32])
    expect(questions[1].type).toBe('TEXT')
    expect(questions[1].isRequired).toBe(false)
  })
})

describe('보딩패스 발급', () => {
  it('dataConsent와 answers를 싣고, 응답을 티켓 모양으로 돌려준다', async () => {
    const fetchMock = respondWith({
      boardingPassId: 5,
      passCode: 'MCM-2026-0825',
      status: 'ISSUED',
      passengerName: 'YEONJU LIM',
      issuedAt: '2026-08-25T11:11:00',
      items: [{ productColorId: 2, name: 'Diamant 참', source: 'WISHLIST' }],
    })
    globalThis.fetch = fetchMock

    const pass = await issueBoardingPass({
      dataConsent: true,
      answers: [{ surveyQuestionId: 3, surveyOptionId: 31 }],
    })

    expect(callOf(fetchMock).body).toEqual({
      dataConsent: true,
      answers: [{ surveyQuestionId: 3, surveyOptionId: 31 }],
    })
    expect(pass.boardingPassId).toBe(5)
    expect(pass.items[0]).toEqual({ productColorId: 2, name: 'Diamant 참', source: 'WISHLIST' })
    // 연출 값은 백엔드가 아니라 우리가 얹는다.
    expect(pass.flightCode).toBe('MCM 6506')
    // issuedAt → 티켓 BOARDING 칸 표기
    expect(pass.boardingLabel).toBe('TUE, 25 AUG 2026')
  })

  it('발급 시각이 없으면 BOARDING 칸을 비운다', async () => {
    // Invalid Date를 그대로 표기하면 티켓에 'INVALID DATE'가 찍힌다.
    globalThis.fetch = respondWith({ boardingPassId: 5, issuedAt: null })

    const pass = await issueBoardingPass({ dataConsent: false, answers: [] })

    expect(pass.boardingLabel).toBe('')
  })
})

describe('최근 보딩패스', () => {
  it('없으면(404) 오류가 아니라 null이다', async () => {
    // 발급 전 상태는 정상 흐름이다. 던지면 완료·스캔 화면이 빈 상태를 못 그린다.
    globalThis.fetch = respondWith(null, { ok: false, status: 404 })

    await expect(getLatestBoardingPass()).resolves.toBeNull()
  })
})

describe('스캔', () => {
  it('storeId가 없으면 본문을 아예 보내지 않는다', async () => {
    const fetchMock = respondWith({ boardingPassId: 5, earnedCredit: 700, creditBalance: 800 })
    globalThis.fetch = fetchMock

    const scan = await scanBoardingPass(5)

    const call = callOf(fetchMock)
    expect(call.url).toMatch(/\/boarding-passes\/5\/scan$/)
    expect(call.body).toBeNull()
    // CreditToast가 쓰는 모양
    expect(scan.credit).toEqual({ amount: 700, balance: 800 })
  })

  it('storeId를 주면 본문에 싣는다', async () => {
    const fetchMock = respondWith({ boardingPassId: 5 })
    globalThis.fetch = fetchMock

    await scanBoardingPass(5, { storeId: 1 })

    expect(callOf(fetchMock).body).toEqual({ storeId: 1 })
  })
})

describe('AI 추천 동선', () => {
  it('층 스텝을 화면 열쇠(1f)와 추천 여부로 옮긴다', async () => {
    globalThis.fetch = respondWith({
      steps: [
        {
          sequence: 1,
          floorId: 11,
          floorNo: 1,
          code: 'JOURNEY',
          title: '여정',
          isRecommended: true,
          reason: '첫 여정으로 알맞습니다.',
        },
        // 추천 아닌 층은 isRecommended가 아예 안 올 수도 있다.
        { sequence: 2, floorId: 15, floorNo: 5, code: 'LOUNGE', title: '라운지' },
      ],
    })

    const route = await getBoardingPassRoute(5)

    expect(route[0]).toMatchObject({
      id: '1f',
      isRecommended: true,
      reason: '첫 여정으로 알맞습니다.',
    })
    expect(route[1]).toMatchObject({ id: '5f', isRecommended: false, reason: null })
  })
})

describe('비행 종료', () => {
  it('POST로 부르고 스탬프 번호까지 돌려준다', async () => {
    const fetchMock = respondWith({
      boardingPassId: 5,
      status: 'COMPLETED',
      stayMinutes: 46,
      passportStampId: 12,
      totalVisitCount: 3,
    })
    globalThis.fetch = fetchMock

    const done = await completeBoardingPass(5)

    const call = callOf(fetchMock)
    expect(call.url).toMatch(/\/boarding-passes\/5\/complete$/)
    expect(call.method).toBe('POST')
    expect(done).toEqual({
      boardingPassId: 5,
      status: 'COMPLETED',
      stayMinutes: 46,
      passportStampId: 12,
      totalVisitCount: 3,
    })
  })
})
