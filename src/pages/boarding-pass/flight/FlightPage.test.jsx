import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx', () => ({
  useBagHandlers: () => ({}),
}))

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getCurrentBoardingPass: vi.fn(async () => null),
}))

import { Component as FlightPage } from './FlightPage.jsx'

function renderFlight() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/flight', Component: FlightPage },
      { path: '/boarding-pass', element: <p>Boarding</p> },
    ],
    { initialEntries: ['/boarding-pass/flight'] },
  )

  render(<RouterProvider router={router} />)

  return router
}

describe('FlightPage', () => {
  it('returns to boarding-pass landing when the flight ends', async () => {
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '\uBE44\uD589 \uC885\uB8CC' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass'))
  })
})
