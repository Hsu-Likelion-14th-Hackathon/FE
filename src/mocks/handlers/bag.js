import { http, HttpResponse } from 'msw'

import { API } from '@/shared/api/endpoints.js'

import { getBagFixture } from '../devFixtures.js'
import { cartItems, emptyCart } from '../fixtures/cart.js'
import { emptyWishlist, wishlistItems } from '../fixtures/wishlist.js'

export const bagHandlers = [
  http.get(API.wishlist, () =>
    HttpResponse.json({ items: getBagFixture() === 'empty' ? emptyWishlist : wishlistItems }),
  ),
  http.get(API.cart, () =>
    HttpResponse.json({ items: getBagFixture() === 'empty' ? emptyCart : cartItems }),
  ),
]
