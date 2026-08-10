import { createBrowserRouter } from 'react-router'

import App, { HydrateFallback } from './App.jsx'

const lazyDefault = (importPage) => async () => {
  const module = await importPage()
  return { Component: module.default ?? module.Component }
}

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
          path: 'boarding-pass/intro',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/intro/IntroPage.jsx')),
        },
        {
          path: 'boarding-pass',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/landing/LandingPage.jsx')),
        },
        {
          path: 'boarding-pass/survey',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/survey/SurveyPage.jsx')),
        },
        {
          path: 'boarding-pass/complete',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/complete/CompletePage.jsx')),
        },
        {
          path: 'boarding-pass/scan',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/scan/ScanPage.jsx')),
        },
        {
          path: 'boarding-pass/flight',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/flight/FlightPage.jsx')),
        },
        {
          path: 'boarding-pass/guide',
          lazy: lazyDefault(() => import('@/pages/boarding-pass/guide/GuidePage.jsx')),
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
