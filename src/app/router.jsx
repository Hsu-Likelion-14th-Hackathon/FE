import { createBrowserRouter } from 'react-router'

import App, { HydrateFallback } from './App.jsx'
import { ProtectedRoute } from './ProtectedRoute.jsx'
import {
  loadCartPage,
  loadCompletePage,
  loadFlightPage,
  loadGuidePage,
  loadHomePage,
  loadIntroPage,
  loadKakaoCallbackPage,
  loadLandingPage,
  loadLoginPage,
  loadNotFoundPage,
  loadPassportPage,
  loadProductDetailPage,
  loadProductListPage,
  loadScanPage,
  loadSignupPage,
  loadSurveyPage,
  loadTryOnPage,
  loadWishlistPage,
} from './routeModules.js'

export function createAppRoutes() {
  return [
    {
      path: '/',
      Component: App,
      HydrateFallback,
      children: [
        {
          index: true,
          lazy: loadHomePage,
        },
        {
          path: 'login',
          lazy: loadLoginPage,
        },
        {
          path: 'signup',
          lazy: loadSignupPage,
        },
        {
          // 카카오 콘솔에 등록한 Redirect URI와 같아야 한다(KAKAO_CALLBACK_PATH).
          path: 'auth/kakao/callback',
          lazy: loadKakaoCallbackPage,
        },
        {
          path: 'boarding-pass',
          lazy: loadLandingPage,
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
              lazy: loadIntroPage,
            },
            {
              path: 'products',
              lazy: loadProductListPage,
            },
            {
              path: 'products/:productId',
              lazy: loadProductDetailPage,
            },
            {
              path: 'products/:productId/try-on',
              lazy: loadTryOnPage,
            },
            {
              path: 'wishlist',
              lazy: loadWishlistPage,
            },
            {
              path: 'cart',
              lazy: loadCartPage,
            },
            {
              path: 'boarding-pass/passport',
              lazy: loadPassportPage,
            },
            {
              path: 'boarding-pass/survey',
              lazy: loadSurveyPage,
            },
            {
              path: 'boarding-pass/complete',
              lazy: loadCompletePage,
            },
            {
              path: 'boarding-pass/scan',
              lazy: loadScanPage,
            },
            {
              path: 'boarding-pass/flight',
              lazy: loadFlightPage,
            },
            {
              path: 'boarding-pass/guide',
              lazy: loadGuidePage,
            },
          ],
        },
        {
          path: '*',
          lazy: loadNotFoundPage,
        },
      ],
    },
  ]
}

export const router = createBrowserRouter(createAppRoutes())
