import { createBrowserRouter, Navigate } from 'react-router-dom'

import RootLayout from '@/app/RootLayout.jsx'

const lazyPage = (importPage) => async () => {
  const module = await importPage()
  return { Component: module.default }
}

export const routes = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/boarding-pass/intro" replace /> },
      {
        path: '/boarding-pass/intro',
        lazy: lazyPage(() => import('@/pages/boarding-pass/intro/IntroPage.jsx')),
      },
      {
        path: '/boarding-pass',
        lazy: lazyPage(() => import('@/pages/boarding-pass/landing/LandingPage.jsx')),
      },
      {
        path: '/boarding-pass/survey',
        lazy: lazyPage(() => import('@/pages/boarding-pass/survey/SurveyPage.jsx')),
      },
      {
        path: '/boarding-pass/complete',
        lazy: lazyPage(() => import('@/pages/boarding-pass/complete/CompletePage.jsx')),
      },
      {
        path: '/boarding-pass/scan',
        lazy: lazyPage(() => import('@/pages/boarding-pass/scan/ScanPage.jsx')),
      },
      {
        path: '/boarding-pass/flight',
        lazy: lazyPage(() => import('@/pages/boarding-pass/flight/FlightPage.jsx')),
      },
      {
        path: '/boarding-pass/guide',
        lazy: lazyPage(() => import('@/pages/boarding-pass/guide/GuidePage.jsx')),
      },
      { path: '/login', lazy: lazyPage(() => import('@/pages/login/LoginPage.jsx')) },
      { path: '*', element: <Navigate to="/boarding-pass/intro" replace /> },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
