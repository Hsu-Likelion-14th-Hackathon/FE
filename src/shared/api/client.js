export async function apiFetch(path, { method = 'GET', body, notFoundAsNull = false } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (notFoundAsNull && response.status === 404) return null
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${method} ${path} (${response.status})`)
  }
  return response.json()
}
