import { getAccessToken } from './authToken.js'

export async function apiFetch(path, { method = 'GET', body, notFoundAsNull = false } = {}) {
  const token = getAccessToken()
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  // 토큰이 없으면 헤더를 붙이지 않는다. 인증이 필요 없는 요청도 있다.
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(path, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (notFoundAsNull && response.status === 404) return null
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${method} ${path} (${response.status})`)
  }
  return response.json()
}
