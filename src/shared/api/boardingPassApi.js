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
 * 스캔 시뮬레이션 (PM 확정 명세).
 * 버튼 1회 탭 → 즉시 SUCCESS fixture 반환. 카메라·실 QR 디코딩 없음.
 */
export function simulateScan(passId) {
  return apiFetch(API.boardingPass.scan, { method: 'POST', body: { passId } })
}
