import { delay, http, HttpResponse } from 'msw'

import { API } from '@/shared/api/endpoints.js'

import { getPassFixture } from '../devFixtures.js'
import { issuedBoardingPass, scanSuccessResult, surveyQuestions } from '../fixtures/boardingPass.js'
import { floorDetails, floorList, routeSteps } from '../fixtures/floors.js'

/** 실제 서버와 같은 공통 래퍼로 감싼다. 목만 다른 모양이면 계약 오류가 숨는다. */
const ok = (result) => HttpResponse.json({ isSuccess: true, code: 'COMMON2000', result })

/** 발급 후 현재 보딩패스 (새로고침·직접 진입에도 화면이 동작하도록 기본 fixture 유지) */
let currentPass = issuedBoardingPass

export const boardingPassHandlers = [
  http.get(API.survey.questions, async () => {
    await delay(200)
    return ok({ questions: surveyQuestions })
  }),
  http.post(API.boardingPass.issue, async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    // 발급 로딩 (30)~(32) 연출을 위한 지연
    await delay(1800)
    currentPass = {
      ...issuedBoardingPass,
      issuedAt: new Date().toISOString().slice(0, 19),
      // 계약 확인용으로 받은 값을 남긴다.
      _received: { dataConsent: body?.dataConsent, answers: body?.answers },
    }
    return ok(currentPass)
  }),
  // GET /boarding-passes/latest. ?pass=none 또는 localStorage mcm-dev-pass=none → 404
  http.get(API.boardingPass.latest, () => {
    if (getPassFixture() === 'none') {
      return new HttpResponse(null, { status: 404 })
    }
    return ok(currentPass)
  }),
  // 스캔 시뮬레이션: 즉시 SCANNED 반환 (카메라·실 스캐너 없음)
  // 경로에 보딩패스 ID가 들어간다. 목도 같은 모양이어야 실제 서버에서만
  // 드러나는 계약 오류를 숨기지 않는다.
  http.post(API.boardingPass.scan(':boardingPassId'), async () => {
    await delay(300)
    return ok(scanSuccessResult)
  }),
  http.get(API.boardingPass.route(':boardingPassId'), () => ok(routeSteps)),
  http.post(API.boardingPass.complete(':boardingPassId'), () =>
    ok({
      boardingPassId: issuedBoardingPass.boardingPassId,
      status: 'COMPLETED',
      stayMinutes: 46,
      passportStampId: 7,
      totalVisitCount: 1,
    }),
  ),
  http.get(API.floor.list, () => ok(floorList)),
  http.get(API.floor.detail(':floorId'), ({ params }) =>
    ok(floorDetails[params.floorId] ?? { ...floorList.floors[0], contents: [] }),
  ),
]
