import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 설문·보딩패스 API.
 *
 * 응답 계약의 기준은 라이브 Swagger다. 목 시절에는 래퍼 없는 응답을
 * 그대로 썼는데, 실서버는 전부 `{ isSuccess, code, message, result }`로
 * 감싸 준다(unwrap).
 */

/**
 * 티켓 지면의 연출 값.
 *
 * 편명·좌석·게이트·출도착은 백엔드 계약에 없는 Figma 디자인 값이다. 실값
 * (passengerName·passCode·issuedAt)만 백엔드에서 오고 나머지는 모든 티켓이
 * 같은 연출을 쓴다.
 */
const TICKET_DESIGN = {
  flightCode: 'MCM 6506',
  cabinClass: 'FIRST CLASS',
  from: { city: 'Seoul', code: 'ICN', localName: '서울' },
  to: { city: 'Munich', code: 'MUC', localName: 'MCM' },
  gate: '1ST FLOOR',
  seat: 'VIP 01',
  timeStart: '11:00 AM',
  timeEnd: '20:00 PM',
}

/** `2026-08-25T11:11:00` → `MON, 25 AUG 2026` (티켓 BOARDING 칸 표기) */
function toBoardingLabel(issuedAt) {
  const date = issuedAt ? new Date(issuedAt) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return date
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replaceAll(',', '')
    .toUpperCase()
    .replace(/^(\w+) (\d+) (\w+) (\d+)$/, '$1, $2 $3 $4')
}

/** 발급·최근 조회 응답 → 티켓 카드가 쓰는 모양 */
function toPass(result) {
  return {
    ...TICKET_DESIGN,
    boardingPassId: result.boardingPassId,
    passCode: result.passCode ?? '',
    status: result.status ?? 'ISSUED',
    passengerName: result.passengerName ?? '',
    issuedAt: result.issuedAt ?? null,
    boardingLabel: toBoardingLabel(result.issuedAt),
    items: (result.items ?? []).map((item) => ({
      productColorId: item.productColorId,
      name: item.name ?? '',
      source: item.source ?? null,
    })),
  }
}

/**
 * GET /surveys/questions — Q1~Q5 단일 선택(필수), Q6 자유 입력(선택).
 * 부제 문구는 계약에 없는 디자인 카피라 화면이 갖는다.
 */
export async function getSurveyQuestions() {
  const result = await apiFetch(API.survey.questions, { unwrap: true })
  return (result.questions ?? []).map((question) => ({
    id: question.surveyQuestionId,
    label: `Q${question.stepNo ?? question.surveyQuestionId}`,
    title: question.content ?? '',
    type: question.questionType ?? 'SINGLE_SELECT',
    isRequired: Boolean(question.isRequired),
    options: [...(question.options ?? [])]
      .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0))
      .map((option) => ({
        id: option.surveyOptionId,
        title: option.label ?? '',
        description: option.description ?? '',
      })),
  }))
}

/**
 * POST /boarding-passes — 발급.
 *
 * dataConsent는 필수다. false면 위시리스트·쇼핑백을 읽지 않고 설문만으로
 * 상품을 고른다(개인정보 동의 절차). answers의 TEXT 문항은 surveyOptionId
 * 대신 textAnswer를 싣는다.
 */
export async function issueBoardingPass({ dataConsent, answers }) {
  const result = await apiFetch(API.boardingPass.issue, {
    method: 'POST',
    body: { dataConsent: Boolean(dataConsent), answers },
    unwrap: true,
  })
  return toPass(result)
}

/**
 * GET /boarding-passes/latest — 최근 발급 보딩패스.
 * 404 → null (완료/스캔/비행의 빈 상태).
 */
export async function getLatestBoardingPass() {
  const result = await apiFetch(API.boardingPass.latest, { unwrap: true, notFoundAsNull: true })
  return result ? toPass(result) : null
}

/**
 * POST /boarding-passes/{id}/scan — 매장 입장 스캔.
 *
 * 응답으로 방문(visitLogId·entryNo)이 만들어지고 크레딧이 지급된다.
 * storeId는 선택이라 없으면 body를 아예 보내지 않는다.
 * 화면은 버튼 한 번으로 끝난다. 카메라나 실제 QR 디코딩은 없다.
 */
export async function scanBoardingPass(boardingPassId, { storeId } = {}) {
  const result = await apiFetch(API.boardingPass.scan(boardingPassId), {
    method: 'POST',
    body: storeId === undefined ? undefined : { storeId },
    unwrap: true,
  })
  return {
    boardingPassId: result.boardingPassId,
    status: result.status ?? 'SCANNED',
    visitLogId: result.visitLogId ?? null,
    entryNo: result.entryNo ?? '',
    scannedAt: result.scannedAt ?? null,
    // CreditToast가 쓰는 모양. 문구는 디자인 카피라 토스트가 갖는다.
    credit: {
      amount: result.earnedCredit ?? 0,
      balance: result.creditBalance ?? null,
    },
  }
}

/**
 * GET /boarding-passes/{id}/route — AI 추천 동선.
 *
 * 발급 때 계산되어 저장된 순서다. isRecommended가 아닌 층도 끝에 붙어
 * 오므로(전체 동선), 화면은 표시만 다르게 한다.
 */
export async function getBoardingPassRoute(boardingPassId) {
  const result = await apiFetch(API.boardingPass.route(boardingPassId), { unwrap: true })
  return (result.steps ?? []).map((step) => ({
    sequence: step.sequence,
    id: `${step.floorNo}f`,
    floorId: step.floorId,
    floorNo: step.floorNo,
    code: step.code ?? '',
    title: step.title ?? '',
    isRecommended: Boolean(step.isRecommended),
    reason: step.reason ?? null,
  }))
}

/**
 * POST /boarding-passes/{id}/complete — 비행 종료(매장 나가기).
 *
 * 이때 방문이 확정되어 여권 스탬프가 생긴다(passportStampId). 화면은 종료
 * 직후 여권으로 보내 그 스탬프를 보여 준다.
 */
export async function completeBoardingPass(boardingPassId) {
  const result = await apiFetch(API.boardingPass.complete(boardingPassId), {
    method: 'POST',
    unwrap: true,
  })
  return {
    boardingPassId: result.boardingPassId,
    status: result.status ?? 'COMPLETED',
    stayMinutes: result.stayMinutes ?? 0,
    passportStampId: result.passportStampId ?? null,
    totalVisitCount: result.totalVisitCount ?? 0,
  }
}
