import { createBrowserRouter } from 'react-router'

import App, { HydrateFallback } from './App.jsx'
import { ProtectedRoute } from './ProtectedRoute.jsx'

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
          // 카카오 콘솔에 등록한 Redirect URI와 같아야 한다(KAKAO_CALLBACK_PATH).
          path: 'auth/kakao/callback',
          lazy: () => import('@/pages/auth/KakaoCallbackPage.jsx'),
        },
        {
          path: 'boarding-pass',
          lazy: () => import('@/pages/boarding-pass/landing/LandingPage.jsx'),
        },
        {
          // 로그인해야 여는 구간. 스웨거상 인증(auth) 계열을 뺀 모든 API가
          // JWT 필수라, 백엔드 데이터로 그리는 화면은 전부 여기 든다.
          // 홈·랜딩은 정적 무대라 공개로 남는다 — 버튼을 눌러 이 구간에
          // 들어오는 순간 로그인으로 보내고, 마치면 제자리로 돌아온다.
          // 인트로는 데이터가 없지만 여정(인트로→설문→발급)의 입구라 함께
          // 잠근다. 공개로 두면 인트로를 보다가 Next에서 끊긴다.
          Component: ProtectedRoute,
          children: [
            {
              path: 'boarding-pass/intro',
              lazy: () => import('@/pages/boarding-pass/intro/IntroPage.jsx'),
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
              path: 'boarding-pass/passport',
              lazy: () => import('@/pages/boarding-pass/passport/PassportPage.jsx'),
            },
            {
              path: 'boarding-pass/survey',
              lazy: () => import('@/pages/boarding-pass/survey/SurveyPage.jsx'),
            },
            {
              path: 'boarding-pass/complete',
              lazy: () => import('@/pages/boarding-pass/complete/CompletePage.jsx'),
            },
            {
              path: 'boarding-pass/scan',
              lazy: () => import('@/pages/boarding-pass/scan/ScanPage.jsx'),
            },
            {
              path: 'boarding-pass/flight',
              lazy: () => import('@/pages/boarding-pass/flight/FlightPage.jsx'),
            },
            {
              path: 'boarding-pass/guide',
              lazy: () => import('@/pages/boarding-pass/guide/GuidePage.jsx'),
            },
          ],
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
