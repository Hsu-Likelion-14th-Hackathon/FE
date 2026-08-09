import { RouterProvider } from 'react-router-dom'

import AppProviders from '@/app/providers.jsx'
import { createAppRouter } from '@/app/router.jsx'

const router = createAppRouter()

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
