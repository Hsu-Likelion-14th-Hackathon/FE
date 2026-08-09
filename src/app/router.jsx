import { createBrowserRouter, Navigate } from 'react-router-dom'

import RootLayout from '@/app/RootLayout.jsx'

export const routes = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/boarding-pass/intro" replace /> },
      { path: '*', element: <Navigate to="/boarding-pass/intro" replace /> },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}