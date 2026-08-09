import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/App.jsx'
import '@/styles/tailwind.css'
import '@/styles/globals.scss'

// 백엔드 없이 동작하는 데모이므로 MSW를 항상 활성화한다.
async function enableMocking() {
  const { worker } = await import('@/mocks/browser.js')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
