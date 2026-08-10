import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'

import StoreMenu from './StoreMenu.jsx'
import StoreMenuContext from './StoreMenuContext.js'

function StoreMenuProvider({ children }) {
  const location = useLocation()
  const [menuState, setMenuState] = useState(() => ({
    isOpen: false,
    locationKey: location.key,
  }))

  if (menuState.locationKey !== location.key) {
    setMenuState({ isOpen: false, locationKey: location.key })
  }

  const isOpen = menuState.locationKey === location.key && menuState.isOpen

  const closeMenu = useCallback(() => {
    setMenuState((currentState) =>
      currentState.isOpen ? { ...currentState, isOpen: false } : currentState,
    )
  }, [])

  const toggleMenu = useCallback(() => {
    setMenuState((currentState) => ({
      isOpen: currentState.locationKey === location.key ? !currentState.isOpen : true,
      locationKey: location.key,
    }))
  }, [location.key])

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
      <StoreMenu isOpen={isOpen} onClose={closeMenu} />
    </StoreMenuContext.Provider>
  )
}

export default StoreMenuProvider
