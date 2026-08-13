import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 여권 API.
 *
 * 백엔드 응답은 `{ isSuccess, code, message, result }` 래퍼를 쓰고
 * 필드명·날짜 형식이 화면과 달라, 여기서 화면이 쓰는 모양으로 변환한다.
 * 화면(passportPageTexture)은 이 모양만 알면 되므로 백엔드가 바뀌어도
 * 이 파일만 고치면 된다.
 */

/** `2026-08-25` → `2026 08 25` (Figma 표기) */
function formatIssueDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', ' ')
}

function unwrap(response) {
  return response?.result ?? response
}

/** GET /passport — 신분면 */
export async function getPassport() {
  const result = unwrap(await apiFetch(API.passport.profile))
  return {
    passportNumber: result.passportNo ?? '',
    // 백엔드는 이름을 한 필드로 준다. 화면도 한 줄로 표시한다.
    name: result.name ?? '',
    nationality: (result.nationality ?? '').toUpperCase(),
    issueDate: formatIssueDate(result.issuedOn),
    credit: result.creditBalance ?? 0,
    visits: result.totalVisitCount ?? 0,
  }
}

/** GET /passport/stamps — 방문 스탬프 목록 */
export async function getPassportStamps() {
  const result = unwrap(await apiFetch(API.passport.stamps))
  return {
    visits: result.totalVisitCount ?? 0,
    stamps: (result.stamps ?? []).map((stamp) => ({
      id: `stamp-${stamp.passportStampId}`,
      visitLogId: stamp.visitLogId,
      date: formatIssueDate(stamp.stampedOn),
      imageUrl: stamp.stampAssetUrl ?? null,
    })),
  }
}

/** GET /passport/visits/{id} — 방문 상세 (TICKET · TRAVEL HISTORY 시트) */
export async function getVisitDetail(visitLogId) {
  const result = unwrap(await apiFetch(API.passport.visit(visitLogId)))
  return {
    visitLogId: result.visitLogId,
    storeName: result.storeName ?? '',
    address: result.address ?? '',
    entryNo: result.entryNo ?? '',
    visitedOn: formatIssueDate(result.scannedAt),
    stayMinutes: result.stayMinutes ?? 0,
    passengerName: result.boardingPass?.passengerName ?? '',
    passCode: result.boardingPass?.passCode ?? '',
    travelHistory: (result.travelHistory ?? []).map((floor) => ({
      id: `floor-${floor.floorNo}`,
      floorNo: floor.floorNo,
      code: floor.code,
      title: floor.title,
    })),
  }
}
