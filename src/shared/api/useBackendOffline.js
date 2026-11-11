import { useEffect, useSyncExternalStore } from 'react'

import { probeBackend } from './client.js'
import { isBackendOffline, subscribeBackendStatus } from './mock/backendStatus.js'

/**
 * 지금 목 폴백으로 동작하는지(백엔드에 닿지 못하는지).
 *
 * 화면이 뜨면 한 번 연결을 확인하고, 이후 요청이 실패하거나 살아나면
 * 그때마다 다시 그린다.
 */
export default function useBackendOffline() {
  const offline = useSyncExternalStore(subscribeBackendStatus, isBackendOffline, () => false)

  useEffect(() => {
    probeBackend()
  }, [])

  return offline
}
