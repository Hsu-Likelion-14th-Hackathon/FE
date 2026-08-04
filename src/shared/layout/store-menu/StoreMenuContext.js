import { createContext } from 'react'

const doNothing = () => {}

const StoreMenuContext = createContext({
  closeMenu: doNothing,
  isOpen: false,
  toggleMenu: doNothing,
})

export default StoreMenuContext
