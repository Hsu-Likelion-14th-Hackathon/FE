import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/** Mock 기본값은 authenticated: true (개발 스위치 ?auth=guest 로만 게스트 검증) */
export function getSession() {
  return apiFetch(API.session)
}
