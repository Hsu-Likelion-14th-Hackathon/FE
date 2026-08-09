import { useCallback, useMemo, useState } from 'react'

import AppToast from '@/shared/ui/AppToast.jsx'
import { ToastContext } from '@/shared/ui/toastContext.js'

function AppProviders({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((content, options = {}) => {
    setToast({
      content,
      position: options.position ?? 'bottom',
      className: options.className ?? '',
      duration: options.duration,
      closeOnOutsideClick: options.closeOnOutsideClick ?? true,
    })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <AppToast
          position={toast.position}
          className={toast.className}
          duration={toast.duration}
          closeOnOutsideClick={toast.closeOnOutsideClick}
          onClose={hideToast}
        >
          {toast.content}
        </AppToast>
      ) : null}
    </ToastContext.Provider>
  )
}

export default AppProviders
