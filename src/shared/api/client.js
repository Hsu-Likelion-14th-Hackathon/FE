import { clearAccessToken, getAccessToken } from './authToken.js'

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

  const response = await fetch(path, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  if (notFoundAsNull && response.status === 404) return null

  const parsed = await readBody(response)

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
