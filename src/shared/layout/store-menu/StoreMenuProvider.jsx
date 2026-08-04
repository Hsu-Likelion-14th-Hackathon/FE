import { useCallback, useEffect, useMemo, useState } from 'react'

import StoreMenu from './StoreMenu.jsx'
import StoreMenuContext from './StoreMenuContext.js'

function StoreMenuProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setIsOpen((currentValue) => !currentValue)
  }, [])

  useEffect(() => {
    function handleHistoryNavigation() {
      setIsOpen(false)
    }

    window.addEventListener('popstate', handleHistoryNavigation)
    return () => window.removeEventListener('popstate', handleHistoryNavigation)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.documentElement.classList.add('store-menu-open')
    document.body.classList.add('store-menu-open')
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.documentElement.classList.remove('store-menu-open')
      document.body.classList.remove('store-menu-open')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMenu, isOpen])

  const contextValue = useMemo(
    () => ({ closeMenu, isOpen, toggleMenu }),
    [closeMenu, isOpen, toggleMenu],
  )

  return (
    <StoreMenuContext.Provider value={contextValue}>
      {children}
      {isOpen ? <StoreMenu onNavigate={closeMenu} /> : null}
    </StoreMenuContext.Provider>
  )
}

export default StoreMenuProvider
