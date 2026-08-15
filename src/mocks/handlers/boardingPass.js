import { delay, http, HttpResponse } from 'msw'

import { API } from '@/shared/api/endpoints.js'

import { getPassFixture } from '../devFixtures.js'
import { issuedBoardingPass, scanSuccessResult, surveyQuestions } from '../fixtures/boardingPass.js'

/** 발급 후 현재 보딩패스 (새로고침·직접 진입에도 화면이 동작하도록 기본 fixture 유지) */
let currentPass = issuedBoardingPass

export const boardingPassHandlers = [
  http.get(API.survey.questions, async () => {
    await delay(200)
    return HttpResponse.json({ questions: surveyQuestions })
  }),
  http.post(API.boardingPass.issue, async ({ request }) => {
    const { answers } = await request.json().catch(() => ({ answers: null }))
    // 발급 로딩 (30)~(32) 연출을 위한 지연
    await delay(1800)
    currentPass = {
      ...issuedBoardingPass,
      surveyAnswers: answers ?? null,
      issuedAt: new Date().toISOString(),
    }
    return HttpResponse.json(currentPass)
  }),
  // GET /boarding-passes/latest. ?pass=none 또는 localStorage mcm-dev-pass=none → 404
  http.get(API.boardingPass.latest, () => {
    if (getPassFixture() === 'none') {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(currentPass)
  }),
  // 스캔 시뮬레이션: 즉시 SUCCESS 반환 (카메라·실 스캐너 없음)
  http.post(API.boardingPass.scan, async () => {
    await delay(300)
    return HttpResponse.json(scanSuccessResult)
  }),
]
