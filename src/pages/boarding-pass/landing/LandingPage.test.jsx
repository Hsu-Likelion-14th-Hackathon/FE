import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

const mockGetLatestBoardingPass = vi.hoisted(() => vi.fn())
const activeRouters = []

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getLatestBoardingPass: mockGetLatestBoardingPass,
}))

import { Component as LandingPage } from './LandingPage.jsx'

function renderLanding() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass', Component: LandingPage },
      { path: '/boarding-pass/survey', element: <p>Survey</p> },
      { path: '/boarding-pass/scan', element: <p>Scan</p> },
      { path: '/boarding-pass/passport', element: <p>Passport</p> },
    ],
    { initialEntries: ['/boarding-pass'] },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  activeRouters.push(router)
  return router
}

describe('LandingPage', () => {
  afterEach(() => {
    activeRouters.splice(0).forEach((router) => router.dispose())
    mockGetLatestBoardingPass.mockReset()
  })

  it('routes guests to survey from the start flight button', async () => {
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: '비행 시작하기' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/survey'))
  })

  it('routes guests with an existing pass to scan', async () => {
    mockGetLatestBoardingPass.mockResolvedValue({ id: 'pass-1' })
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: '기존 BOARDING PASS 스캔' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/scan'))
  })

  it('routes guests to Passport from the Passport button', async () => {
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT \uD655\uC778' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/passport'))
  })

  it('returns to landing after one back from a rapid double-click Passport navigation', async () => {
    const router = renderLanding()
    const passportButton = await screen.findByRole('button', { name: 'PASSPORT \uD655\uC778' })

    fireEvent.click(passportButton)
    fireEvent.click(passportButton)

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/passport'))
    await router.navigate(-1)

    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('keeps the close and Passport controls at least 44px tall without enlarging their glyphs', async () => {
    renderLanding()

    const close = screen.getByRole('button', { name: '닫기' })
    const passport = await screen.findByRole('button', { name: 'PASSPORT 확인' })

    expect(window.getComputedStyle(close).width).toBe('2.75rem')
    expect(window.getComputedStyle(close).height).toBe('2.75rem')
    expect(window.getComputedStyle(passport).height).toBe('2.75rem')
    expect(close.querySelector('img')).toHaveStyle({ width: '0.875rem', height: '0.875rem' })
    expect(
      window.getComputedStyle(document.querySelector('[class*="planeFrame"] img')).transform,
    ).toBe('scale(1.3226)')
  })

  it('subtracts the shared header and safe top from the stage height', () => {
    renderLanding()

    const stage = screen
      .getByRole('heading', { level: 2, name: 'MCM BOARDING PASS' })
      .closest('section')

    expect(stage.style.minHeight).toBe(
      'calc(var(--mcm-viewport-stable) - var(--mcm-header-height) - var(--mcm-safe-top))',
    )
  })
})
