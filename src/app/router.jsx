import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import MobileShell from '@/shared/layout/MobileShell.jsx'

const IntroPage = lazy(() => import('@/pages/boarding-pass/intro/IntroPage.jsx'))
const LandingPage = lazy(() => import('@/pages/boarding-pass/landing/LandingPage.jsx'))
const SurveyPage = lazy(() => import('@/pages/boarding-pass/survey/SurveyPage.jsx'))
const CompletePage = lazy(() => import('@/pages/boarding-pass/complete/CompletePage.jsx'))
const ScanPage = lazy(() => import('@/pages/boarding-pass/scan/ScanPage.jsx'))
const FlightPage = lazy(() => import('@/pages/boarding-pass/flight/FlightPage.jsx'))
const GuidePage = lazy(() => import('@/pages/boarding-pass/guide/GuidePage.jsx'))
const LoginPage = lazy(() => import('@/pages/login/LoginPage.jsx'))

function RootLayout() {
  return (
    <MobileShell>
      <Suspense fallback={<div aria-hidden="true" className="min-h-dvh" />}>
        <Outlet />
      </Suspense>
    </MobileShell>
  )
}

export const routes = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/boarding-pass/intro" replace /> },
      { path: '/boarding-pass/intro', element: <IntroPage /> },
      { path: '/boarding-pass', element: <LandingPage /> },
      { path: '/boarding-pass/survey', element: <SurveyPage /> },
      { path: '/boarding-pass/complete', element: <CompletePage /> },
      { path: '/boarding-pass/scan', element: <ScanPage /> },
      { path: '/boarding-pass/flight', element: <FlightPage /> },
      { path: '/boarding-pass/guide', element: <GuidePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '*', element: <Navigate to="/boarding-pass/intro" replace /> },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
