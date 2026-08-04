import { createBrowserRouter } from 'react-router'

import App, { HydrateFallback } from './App.jsx'

export function createAppRoutes() {
  return [
    {
      id: 'root',
      path: '/',
      Component: App,
      HydrateFallback,
      children: [
        {
          id: 'home',
          index: true,
          lazy: () => import('@/pages/home/HomePage.jsx'),
        },
        {
          id: 'login',
          path: 'login',
          lazy: () => import('@/pages/login/LoginPage.jsx'),
        },
        {
          id: 'signup',
          path: 'signup',
          lazy: () => import('@/pages/signup/SignupPage.jsx'),
        },
        {
          id: 'product-list',
          path: 'products',
          lazy: () => import('@/pages/product-list/ProductListPage.jsx'),
        },
        {
          id: 'product-detail',
          path: 'products/:productId',
          lazy: () => import('@/pages/product-detail/ProductDetailPage.jsx'),
        },
        {
          id: 'try-on',
          path: 'products/:productId/try-on',
          lazy: () => import('@/pages/try-on/TryOnPage.jsx'),
        },
        {
          id: 'wishlist',
          path: 'wishlist',
          lazy: () => import('@/pages/wishlist/WishlistPage.jsx'),
        },
        {
          id: 'cart',
          path: 'cart',
          lazy: () => import('@/pages/cart/CartPage.jsx'),
        },
        {
          id: 'not-found',
          path: '*',
          lazy: () => import('@/pages/not-found/NotFoundPage.jsx'),
        },
      ],
    },
  ]
}

export const router = createBrowserRouter(createAppRoutes())
