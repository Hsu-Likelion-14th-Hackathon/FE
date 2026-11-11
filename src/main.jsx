import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { router } from '@/app/router.jsx'
import '@/styles/tailwind.css'
import '@/styles/globals.scss'
import { installBrowserViewport } from '@/shared/layout/browserViewport.js'

installBrowserViewport()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
