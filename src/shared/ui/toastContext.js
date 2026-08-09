import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/**
 * 전역 토스트 컨트롤.
 * showToast(content, {
 *   position?: 'bottom' | 'top' | 'center',
 *   className?: string,
 *   duration?: number, // ms. 있으면 해당 시간 후 페이드아웃
 * })
 * hideToast()
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast는 AppProviders(ToastProvider) 내부에서만 사용할 수 있습니다.')
  }
  return context
}
