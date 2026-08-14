import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getCurrentBoardingPass: vi.fn(async () => null),
}))

import { Component as FlightPage } from './FlightPage.jsx'
import styles from './FlightPage.module.scss'

const activeRouters = []

function renderFlight() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/flight', Component: FlightPage },
      { path: '/boarding-pass', element: <p>Boarding</p> },
      { path: '/boarding-pass/guide', element: <p>Guide</p> },
      { path: '/boarding-pass/scan', element: <p>Scan</p> },
    ],
    { initialEntries: ['/boarding-pass/flight'] },
  )

  render(<RouterProvider router={router} />)

  activeRouters.push(router)
  return router
}

describe('FlightPage', () => {
  afterEach(() => {
    activeRouters.splice(0).forEach((router) => router.dispose())
  })

  it('jumps to the travel guide overview when the second slider segment is pressed', async () => {
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '가이드 개요로 이동' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/guide'))
    expect(router.state.location.state).toEqual({ floor: 'overview' })
  })

  it('goes to the travel guide when next is pressed', async () => {
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '\uB2E4\uC74C' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/guide'))
  })

  it('disables previous on the first travel step', async () => {
    renderFlight()

    expect(await screen.findByRole('button', { name: '\uC774\uC804' })).toBeDisabled()
  })

  it('returns to boarding-pass landing when the flight ends', async () => {
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '\uBE44\uD589 \uC885\uB8CC' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass'))
  })

  it('flies the route marker from SEOUL to MUNICH then jumps back', () => {
    renderFlight()

    const marker = screen.getByTestId('plane-marker')
    expect(marker).toHaveClass(styles.planeMarker)
    expect(marker.getAttribute('src')).toBeTruthy()
  })
})
