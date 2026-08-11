import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { router } from '@/app/router.jsx'
import '@/styles/tailwind.css'
import '@/styles/globals.scss'

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW !== 'true') {
    return
  }

  // onUnhandledRequest: bypass — 보딩패스 외 요청은 그대로 통과
  const { worker } = await import('@/mocks/browser.js')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

enableMocking()
  .catch((error) => console.warn('MSW 시작 실패, 실제 API를 사용합니다.', error))
  .then(renderApp)
