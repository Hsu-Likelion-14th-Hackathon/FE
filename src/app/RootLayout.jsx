import { Suspense } from 'react'
import { Outlet } from 'react-router'

import MobileShell from '@/shared/layout/MobileShell.jsx'

function RootLayout() {
  return (
    <MobileShell>
      <Suspense
        fallback={
          <main
            className="grid min-h-[var(--mcm-viewport-stable)] place-items-center"
            aria-busy="true"
          />
        }
      >
        <Outlet />
      </Suspense>
    </MobileShell>
  )
}

export default RootLayout
