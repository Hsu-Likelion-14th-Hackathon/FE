import { clearAccessToken, getAccessToken } from './authToken.js'
import { API_BASE_URL } from './endpoints.js'
import {
  isBackendOffline,
  isUnreachableResponse,
  markBackendOffline,
  markBackendOnline,
  MOCK_MODE,
  PROBE_TIMEOUT_MS,
  shouldProbe,
} from './mock/backendStatus.js'

/**
 * 백엔드가 돌려준 실패를 그대로 들고 다니는 오류.
 *
 * 화면마다 필요한 정보가 다르다. 중복 가입은 message를 폼 옆에 띄워야 하고,
 * 최근 탑승권 없음은 빈 상태로 바꿔야 하며, 401은 로그인으로 보내야 한다.
 * status·code·message를 모두 남겨 두면 호출부가 골라 쓸 수 있다.
 */
export class ApiError extends Error {
  constructor({ status, code, message, path }) {
    super(message || `API 요청 실패 (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = code ?? null
    this.path = path
  }
}

/**
 * 응답 본문을 JSON으로 읽는다. 못 읽으면 null.
 *
 * Swagger가 31개 응답의 media type을 전부 와일드카드로 선언해 Content-Type을
 * 믿을 수 없다. 헤더를 보지 않고 text로 읽은 뒤 파싱을 시도한다. 204나 빈
 * 본문도 흔하므로 비어 있으면 그대로 null이다.
 */
async function readBody(response) {
  let text
  try {
    text = await response.text()
  } catch (cause) {
    // 화면 이탈로 끊긴(abort) 요청이다. 삼키면 계약 오류로 둔갑해 호출부의
    // AbortError 가드를 통과하지 못한다. 그 밖의 읽기 실패만 빈 본문으로 본다.
    if (cause?.name === 'AbortError') throw cause
    text = ''
  }
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * 백엔드 공통 응답에서 result만 꺼낸다.
 *
 * 모든 응답이 `{ isSuccess, code, message, result }` 래퍼를 쓴다. 페이지가
 * 이 구조를 직접 해석하면 백엔드가 래퍼를 바꿀 때 화면이 전부 깨진다.
 *
 * 아직 옮기지 않은 호출부가 있어 기본값은 끈 상태다. 도메인 API를 하나씩
 * 옮기면서 켜고, 다 옮기면 기본값으로 바꾼다.
 */
function unwrapEnvelope(body, { status, path }) {
  if (!body || typeof body !== 'object' || !('result' in body)) {
    throw new ApiError({
      status,
      code: 'CONTRACT_ERROR',
      message: '백엔드 응답에 result가 없습니다',
      path,
    })
  }
  return body.result
}

/**
 * 백엔드로 보내되, 닿지 않으면 목 서버(mock/mockServer.js)의 응답으로 대신한다.
 *
 * 백엔드 코드를 건드리지 않고 배포본에서도 화면을 끝까지 볼 수 있게 하려는
 * 장치다. 언제 목을 쓰는지는 mock/backendStatus.js가 정한다.
 *
 * @returns {Promise<{ status: number, ok: boolean, parsed?: any, raw?: Response }>}
 *   parsed가 있으면 이미 읽은 본문, 없으면 raw에서 읽는다.
 */
async function send(path, { method, headers, body, signal }) {
  const fallback = async () => {
    // 목 서버는 백엔드에 닿지 못할 때만 받는다. 정상일 때 모든 사용자가
    // 메인 번들로 목 데이터까지 내려받을 이유가 없다.
    const { mockRespond } = await import('./mock/mockServer.js')
    const mocked = await mockRespond({ url: path, method, body, baseUrl: API_BASE_URL, signal })
    if (!mocked) return null
    return {
      status: mocked.status,
      ok: mocked.status >= 200 && mocked.status < 300,
      parsed: mocked.body,
    }
  }

  if (isBackendOffline()) {
    const mocked = await fallback()
    if (mocked) return mocked
  }

  let raw
  try {
    raw = await fetchWithProbe(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (cause) {
    // 화면 이탈로 끊은 요청은 목으로 바꾸지 않는다 — 호출부의 AbortError 가드가 받아야 한다.
    if (signal?.aborted || MOCK_MODE === 'off') throw cause
    markBackendOffline(cause?.message ?? 'network error')
    const mocked = await fallback()
    if (mocked) return mocked
    throw cause
  }

  if (MOCK_MODE !== 'off' && raw.status >= 500) {
    const parsed = await readBody(raw)
    if (isUnreachableResponse(raw, parsed)) {
      markBackendOffline(`HTTP ${raw.status}`)
      const mocked = await fallback()
      if (mocked) return mocked
    }
    return { status: raw.status, ok: raw.ok, parsed }
  }

  markBackendOnline()
  return { status: raw.status, ok: raw.ok, raw }
}

/**
 * 백엔드가 살아 있는지 아직 모를 때는 PROBE_TIMEOUT_MS 안에 응답이 없으면
 * 끊는다. 서버가 꺼져 있으면 연결이 수십 초씩 매달려 화면이 멈춘 것처럼
 * 보이기 때문이다. 한 번이라도 응답을 받으면 타임아웃 없이 보낸다.
 */
async function fetchWithProbe(path, init) {
  if (!shouldProbe()) return fetch(path, init)

  const controller = new AbortController()
  const outer = init.signal
  const onAbort = () => controller.abort(outer.reason)
  if (outer) {
    if (outer.aborted) controller.abort(outer.reason)
    else outer.addEventListener('abort', onAbort, { once: true })
  }
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, PROBE_TIMEOUT_MS)

  try {
    return await fetch(path, { ...init, signal: controller.signal })
  } catch (cause) {
    if (timedOut) throw new Error(`백엔드 응답 없음 (${PROBE_TIMEOUT_MS}ms)`)
    throw cause
  } finally {
    clearTimeout(timer)
    outer?.removeEventListener('abort', onAbort)
  }
}

/**
 * 백엔드에 닿는지 한 번 확인한다. 로그인 화면이 들어서자마자 데모 모드
 * 안내를 띄울지 정하려고 부른다 — 요청이 실패한 뒤에야 알면 사용자는 이미
 * 이메일·비밀번호를 치고 있다.
 *
 * mode: 'no-cors'로 보낸다. 응답 내용은 필요 없고 연결이 되는지만 보면
 * 된다. CORS 헤더가 없는 경로라도 연결되면 opaque 응답으로 끝나고, 서버가
 * 꺼져 있으면 네트워크 오류나 타임아웃으로 떨어진다. 같은 출처 프록시
 * (/backend)는 백엔드가 죽으면 502·503·504를 준다.
 *
 * @returns {Promise<boolean>} 목으로 동작 중이면 true
 */
export async function probeBackend() {
  if (MOCK_MODE !== 'fallback' || isBackendOffline()) return isBackendOffline()
  try {
    const response = await fetchWithProbe(`${API_BASE_URL}/`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    })
    if (response.type !== 'opaque' && [502, 503, 504].includes(response.status)) {
      markBackendOffline(`HTTP ${response.status}`)
      return true
    }
    markBackendOnline()
    return false
  } catch (cause) {
    markBackendOffline(cause?.message ?? 'network error')
    return true
  }
}

/**
 * @param {string} path 완성된 URL
 * @param {object} [options]
 * @param {boolean} [options.auth] 토큰을 붙일지. login/signup/kakao만 false다.
 *   Swagger는 전역 JWT를 31개 전체에 상속시켜 공개 API도 잠금으로 표시하지만,
 *   그 표기를 클라이언트 동작에 그대로 복제하지 않는다.
 * @param {boolean} [options.unwrap] 성공 응답에서 result만 돌려줄지.
 * @param {boolean} [options.notFoundAsNull] 404를 오류 대신 null로 받을지.
 * @param {AbortSignal} [options.signal] 화면을 떠날 때 요청을 끊는다.
 */
export async function apiFetch(
  path,
  { method = 'GET', body, auth = true, unwrap = false, notFoundAsNull = false, signal } = {},
) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'

  const token = auth ? getAccessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await send(path, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body,
    signal,
  })

  if (notFoundAsNull && response.status === 404) return null

  const parsed = 'parsed' in response ? response.parsed : await readBody(response.raw)

  if (!response.ok) {
    // 401은 붙여 보낸 토큰이 죽었다는 뜻이다. 지워야 다음 요청이 죽은 토큰을 또
    // 보내지 않고, 구독 중인 화면도 미인증으로 바뀐다. 어디로 보낼지는 화면이
    // 정한다. 단 토큰 없이 나간 요청(로그인 실패 401 등)은 세션과 무관하므로
    // 멀쩡한 기존 토큰을 건드리지 않는다.
    if (response.status === 401 && token) clearAccessToken()
    throw new ApiError({
      status: response.status,
      code: parsed?.code,
      message: parsed?.message,
      path,
    })
  }

  if (unwrap) return unwrapEnvelope(parsed, { status: response.status, path })
  return parsed
}
