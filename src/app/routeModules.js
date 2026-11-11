/**
 * 화면 모듈을 불러오는 함수들.
 *
 * 라우터의 lazy와 다음 화면 미리 받기(useRoutePrefetch)가 같은 함수를
 * 쓴다. 미리 받은 모듈은 브라우저 모듈 캐시에 남아, 실제로 넘어갈 때
 * lazy가 기다리지 않고 바로 풀린다.
 */
export const loadHomePage = () => import('@/pages/home/HomePage.jsx')
export const loadLoginPage = () => import('@/pages/login/LoginPage.jsx')
export const loadSignupPage = () => import('@/pages/signup/SignupPage.jsx')
export const loadKakaoCallbackPage = () => import('@/pages/auth/KakaoCallbackPage.jsx')
export const loadLandingPage = () => import('@/pages/boarding-pass/landing/LandingPage.jsx')
export const loadIntroPage = () => import('@/pages/boarding-pass/intro/IntroPage.jsx')
export const loadProductListPage = () => import('@/pages/product-list/ProductListPage.jsx')
export const loadProductDetailPage = () => import('@/pages/product-detail/ProductDetailPage.jsx')
export const loadTryOnPage = () => import('@/pages/try-on/TryOnPage.jsx')
export const loadWishlistPage = () => import('@/pages/wishlist/WishlistPage.jsx')
export const loadCartPage = () => import('@/pages/cart/CartPage.jsx')
export const loadPassportPage = () => import('@/pages/boarding-pass/passport/PassportPage.jsx')
export const loadSurveyPage = () => import('@/pages/boarding-pass/survey/SurveyPage.jsx')
export const loadCompletePage = () => import('@/pages/boarding-pass/complete/CompletePage.jsx')
export const loadScanPage = () => import('@/pages/boarding-pass/scan/ScanPage.jsx')
export const loadFlightPage = () => import('@/pages/boarding-pass/flight/FlightPage.jsx')
export const loadGuidePage = () => import('@/pages/boarding-pass/guide/GuidePage.jsx')
export const loadNotFoundPage = () => import('@/pages/not-found/NotFoundPage.jsx')
