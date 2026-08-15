import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 여권 API.
 *
 * 백엔드 필드명과 날짜 형식이 화면과 달라, 여기서 화면이 쓰는 모양으로
 * 변환한다. 화면(passportPageTexture)은 이 모양만 알면 되므로 백엔드가
 * 바뀌어도 이 파일만 고치면 된다.
 *
 * `{ isSuccess, code, message, result }` 래퍼를 벗기는 일은 apiFetch가 맡는다
 * (`unwrap: true`). 모듈마다 따로 벗기면 한 곳만 빠뜨려도 화면이 래퍼를
 * 직접 들여다보게 된다.
 */

/** `2026-08-25` → `2026 08 25` (Figma 표기) */
function formatIssueDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', ' ')
}

/** GET /passport — 신분면 */
export async function getPassport() {
  const result = await apiFetch(API.passport.profile, { unwrap: true })
  return {
    passportNumber: result.passportNo ?? '',
    // 백엔드는 이름을 한 필드로 준다. 화면도 한 줄로 표시한다.
    name: result.name ?? '',
    // ISO 3166-1 alpha-2(`KR`). 지면 표기(alpha-3) 변환은 화면이 맡는다.
    nationality: (result.nationality ?? '').toUpperCase(),
    // 생년월일도 발급일과 같은 표기로 맞춘다. 빠뜨리면 성공 응답에서 칸이 빈다.
    birthDate: formatIssueDate(result.birthDate),
    issueDate: formatIssueDate(result.issuedOn),
    credit: result.creditBalance ?? 0,
    visits: result.totalVisitCount ?? 0,
  }
}

/** GET /passport/stamps — 방문 스탬프 목록 */
export async function getPassportStamps() {
  const result = await apiFetch(API.passport.stamps, { unwrap: true })
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
  const result = await apiFetch(API.passport.visit(visitLogId), { unwrap: true })
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
      floorId: floor.floorId ?? null,
      floorNo: floor.floorNo,
      code: floor.code,
      title: floor.title,
      tagline: floor.tagline ?? '',
    })),
  }
}
