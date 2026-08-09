import { createBrowserRouter } from 'react-router'

import App, { HydrateFallback } from './App.jsx'

export function createAppRoutes() {
  return [
    {
      path: '/',
      Component: App,
      HydrateFallback,
      children: [
        {
          index: true,
          lazy: () => import('@/pages/home/HomePage.jsx'),
        },
        {
          path: 'login',
          lazy: () => import('@/pages/login/LoginPage.jsx'),
        },
        {
          path: 'signup',
          lazy: () => import('@/pages/signup/SignupPage.jsx'),
        },
        {
          path: 'products',
          lazy: () => import('@/pages/product-list/ProductListPage.jsx'),
        },
        {
          path: 'products/:productId',
          lazy: () => import('@/pages/product-detail/ProductDetailPage.jsx'),
        },
        {
          path: 'products/:productId/try-on',
          lazy: () => import('@/pages/try-on/TryOnPage.jsx'),
        },
        {
          path: 'wishlist',
          lazy: () => import('@/pages/wishlist/WishlistPage.jsx'),
        },
        {
          path: 'cart',
          lazy: () => import('@/pages/cart/CartPage.jsx'),
        },
        {
          path: '*',
          lazy: () => import('@/pages/not-found/NotFoundPage.jsx'),
        },
      ],
    },
  ]
}

export const router = createBrowserRouter(createAppRoutes())
