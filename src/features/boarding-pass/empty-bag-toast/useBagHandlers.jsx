import { useCallback } from 'react'

import { getCart } from '@/shared/api/cartApi.js'
import { getWishlist } from '@/shared/api/wishlistApi.js'
import { useToast } from '@/shared/ui/toastContext.js'

import EmptyBagToast from './EmptyBagToast.jsx'

/**
 * 헤더 위시/카트 아이콘 공통 핸들러.
 * - 목록이 비어 있으면 하단 EmptyBagToast(D-06 버튼 포함)를 띄운다.
 * - 항목이 있으면 D-07 미연결: /wishlist·/cart 등으로 navigate하지 않는다 (no-op).
 * BoardingPassChrome의 onWishlistClick/onCartClick으로 페이지에서 주입한다.
 */
export function useBagHandlers() {
  const { showToast } = useToast()

  const handleBagClick = useCallback(
    async (kind) => {
      let items = []
      try {
        items = kind === 'wishlist' ? await getWishlist() : await getCart()
      } catch {
        items = []
      }
      if (!items || items.length === 0) {
        showToast(<EmptyBagToast kind={kind} />, { position: 'bottom' })
      }
      // 항목 있음 → D-07 (이번 Phase 미연결, no-op)
    },
    [showToast],
  )

  return {
    onWishlistClick: () => handleBagClick('wishlist'),
    onCartClick: () => handleBagClick('cart'),
  }
}
