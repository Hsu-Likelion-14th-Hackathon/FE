import { useContext } from 'react'

import StoreMenuContext from './StoreMenuContext.js'

export default function useStoreMenu() {
  return useContext(StoreMenuContext)
}
