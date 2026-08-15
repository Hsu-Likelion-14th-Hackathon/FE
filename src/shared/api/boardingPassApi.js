import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/** 설문 문항 3개를 조회한다. */
export function getSurveyQuestions() {
  return apiFetch(API.survey.questions)
}

/** 설문 답변으로 보딩패스를 발급한다. Mock은 로딩 연출을 위해 약간의 지연 후 응답한다. */
export function issueBoardingPass(answers) {
  return apiFetch(API.boardingPass.issue, { method: 'POST', body: { answers } })
}

/**
 * 최근 발급 보딩패스 조회.
 * 404 → null (T-01 · 완료/스캔/비행 빈 상태).
 */
export function getLatestBoardingPass() {
  return apiFetch(API.boardingPass.latest, { notFoundAsNull: true })
}

/**
 * 매장 입장 스캔.
 *
 * 명세는 보딩패스 ID를 경로에 담고 body에는 storeId만 받는다. 예전에는
 * `/boarding-pass/scan`에 ID를 body로 보냈는데, 명세에 없는 경로라 실서버에서
 * 404가 난다.
 *
 * storeId는 선택이다. 기본값이 정해지지 않아 없으면 body를 아예 보내지 않는다.
 *
 * 화면은 버튼 한 번으로 끝난다. 카메라나 실제 QR 디코딩은 없다.
 */
export function scanBoardingPass(boardingPassId, { storeId } = {}) {
  return apiFetch(API.boardingPass.scan(boardingPassId), {
    method: 'POST',
    body: storeId === undefined ? undefined : { storeId },
  })
}
