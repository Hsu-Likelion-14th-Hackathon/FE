import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

const mockSession = vi.hoisted(() => ({ isAuthenticated: false, status: 'success' }))
const activeRouters = []

vi.mock('@/entities/session/useSession.js', () => ({
  useSession: () => mockSession,
}))

vi.mock('@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx', () => ({
  useBagHandlers: () => ({}),
}))

import { Component as LandingPage } from './LandingPage.jsx'

function renderLanding() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass', Component: LandingPage },
      { path: '/boarding-pass/passport', element: <p>Passport</p> },
      { path: '/login', element: <p>Login</p> },
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
    mockSession.isAuthenticated = false
    mockSession.status = 'success'
  })

  it('routes authenticated users to Passport from the Passport button', async () => {
    mockSession.isAuthenticated = true
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT \uD655\uC778' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/passport'))
  })

  it('routes unauthenticated users to login from the Passport button', async () => {
    mockSession.isAuthenticated = false
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT \uD655\uC778' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('does not navigate from the Passport button while authentication is loading', async () => {
    mockSession.isAuthenticated = false
    mockSession.status = 'loading'
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT \uD655\uC778' }))

    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('returns to landing after one back from a rapid double-click Passport navigation', async () => {
    mockSession.isAuthenticated = true
    mockSession.status = 'success'
    const router = renderLanding()
    const passportButton = await screen.findByRole('button', { name: 'PASSPORT \uD655\uC778' })

    fireEvent.click(passportButton)
    fireEvent.click(passportButton)

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/passport'))
    await router.navigate(-1)

    expect(router.state.location.pathname).toBe('/boarding-pass')
  })
})
