/**
 * 백엔드에 닿는지 기억해 두는 곳 — 목 폴백을 쓸지 정한다.
 *
 * VITE_API_MOCK
 *   - 'fallback' (기본): 백엔드가 응답하지 않을 때만 목으로 돌린다.
 *   - 'always': 백엔드를 부르지 않고 항상 목을 쓴다(데모·오프라인 작업).
 *   - 'off': 목을 쓰지 않는다. 실패는 그대로 화면에 올라간다.
 * 테스트(vitest)에서는 명시하지 않으면 'off'다 — fetch를 직접 흉내 내는
 * 기존 테스트가 목 응답에 가려지지 않게 한다.
 *
 * 한 번 닿지 않으면 OFFLINE_TTL 동안은 바로 목을 쓴다. 매 요청마다 타임아웃을
 * 기다리면 화면 하나 그리는 데 수십 초가 걸린다. 시간이 지나면 다시 시도해,
 * 백엔드가 살아나면 자연스럽게 실서버로 돌아간다.
 */

const configured = import.meta.env.VITE_API_MOCK
export const MOCK_MODE = configured || (import.meta.env.MODE === 'test' ? 'off' : 'fallback')

/** 백엔드가 아직 한 번도 응답하지 않았을 때 기다리는 최대 시간 */
export const PROBE_TIMEOUT_MS = 6000

const OFFLINE_KEY = 'mcm-backend-offline-at'
const OFFLINE_TTL_MS = 5 * 60 * 1000

/** 'unknown' → 응답을 받으면 'online'. 오프라인은 저장소 시각으로 판단한다. */
let status = 'unknown'

function readOfflineAt() {
  try {
    return Number(sessionStorage.getItem(OFFLINE_KEY)) || 0
  } catch {
    return 0
  }
}

export function isBackendOffline() {
  if (MOCK_MODE === 'always') return true
  if (MOCK_MODE === 'off') return false
  const at = readOfflineAt()
  return Boolean(at) && Date.now() - at < OFFLINE_TTL_MS
}

/** 아직 살아 있는지 모를 때만 타임아웃을 건다. AI 발급·피팅처럼 오래 걸리는 정상 요청을 끊지 않으려는 것. */
export function shouldProbe() {
  return MOCK_MODE === 'fallback' && status !== 'online'
}

export function markBackendOnline() {
  status = 'online'
  try {
    sessionStorage.removeItem(OFFLINE_KEY)
  } catch {
    // 무시
  }
}

let warned = false

export function markBackendOffline(reason) {
  status = 'unknown'
  try {
    sessionStorage.setItem(OFFLINE_KEY, String(Date.now()))
  } catch {
    // 무시
  }
  if (!warned) {
    warned = true
    console.warn(`[mock] 백엔드에 연결할 수 없어 목 데이터로 표시합니다. (${reason})`)
  }
}

/**
 * 이 응답이 "백엔드에 닿지 못했다"는 뜻인지.
 *
 * 게이트웨이 오류(502·503·504)와, 프록시가 백엔드 대신 내놓은 JSON 아닌
 * 5xx(Vite 프록시 오류 등)만 해당한다. 백엔드가 직접 돌려준 500(공통 래퍼
 * JSON)은 실제 서버 오류라 그대로 화면에 올린다.
 */
export function isUnreachableResponse(response, parsed) {
  if ([502, 503, 504].includes(response.status)) return true
  return response.status >= 500 && (parsed == null || typeof parsed !== 'object')
}
