import { http, HttpResponse } from 'msw'

import { API } from '@/shared/api/endpoints.js'

import { getBagFixture } from '../devFixtures.js'
import { cartItems, emptyCart } from '../fixtures/cart.js'
import { emptyWishlist, wishlistItems } from '../fixtures/wishlist.js'

/** 실제 서버와 같은 공통 래퍼로 감싼다. 목만 다른 모양이면 계약 오류가 숨는다. */
const ok = (result) => HttpResponse.json({ isSuccess: true, code: 'COMMON200', result })

export const bagHandlers = [
  http.get(API.wishlist, () => {
    const items = getBagFixture() === 'empty' ? emptyWishlist : wishlistItems
    return ok({ items, totalCount: items.length })
  }),
  http.get(API.shoppingBag, () => {
    const items = getBagFixture() === 'empty' ? emptyCart : cartItems
    return ok({ items, totalCount: items.length })
  }),
]
