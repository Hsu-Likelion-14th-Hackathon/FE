import { Outlet } from 'react-router'

import AppProviders from '@/app/providers.jsx'
import SpeedInsightsTracker from '@/app/SpeedInsightsTracker.jsx'
import useRoutePrefetch from '@/app/useRoutePrefetch.js'
import MobileShell from '@/shared/layout/mobile-shell/MobileShell.jsx'
import StoreMenuProvider from '@/shared/layout/store-menu/StoreMenuProvider.jsx'

function App() {
  useRoutePrefetch()

  return (
    <MobileShell>
      <AppProviders>
        <StoreMenuProvider>
          <Outlet />
        </StoreMenuProvider>
      </AppProviders>
      {/* 개발 서버에서는 Vercel CDN의 디버그 스크립트를 불러오므로 배포 빌드에서만 켠다. */}
      {import.meta.env.PROD ? <SpeedInsightsTracker /> : null}
    </MobileShell>
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
