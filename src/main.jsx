import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/App.jsx'
import '@/styles/tailwind.css'
import '@/styles/globals.scss'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
