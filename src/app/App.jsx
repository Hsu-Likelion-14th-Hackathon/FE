import { Outlet } from 'react-router'

import AppProviders from '@/app/providers.jsx'
import MobileShell from '@/shared/layout/mobile-shell/MobileShell.jsx'
import StoreMenuProvider from '@/shared/layout/store-menu/StoreMenuProvider.jsx'

function App() {
  return (
    <AppProviders>
      <MobileShell>
        <StoreMenuProvider>
          <Outlet />
        </StoreMenuProvider>
      </MobileShell>
    </AppProviders>
  )
}

export function HydrateFallback() {
  return (
    <MobileShell>
      <div
        className="grid min-h-[var(--mcm-viewport-stable)] place-items-center px-5 py-10"
        role="status"
      >
        <p className="text-ink text-sm">화면을 불러오는 중입니다.</p>
      </div>
    </MobileShell>
  )
}

export default App
