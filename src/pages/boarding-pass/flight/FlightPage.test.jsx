import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getLatestBoardingPass: vi.fn(async () => null),
}))

import navStyles from '@/shared/layout/BoardingPassStepNav.module.scss'

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

  it('keeps step hit targets outside the 10px rail', async () => {
    renderFlight()

    const hit = await screen.findByRole('button', { name: '가이드 개요로 이동' })
    expect(hit.closest(`.${navStyles.progressTrack}`)).toBeNull()
    expect(hit).toHaveClass(navStyles.progressHit)
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

  it('shows a recoverable empty ticket instead of endless loading', async () => {
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '티켓 정보' }))

    expect(await screen.findByText('발급된 보딩패스를 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('티켓을 불러오는 중…')).not.toBeInTheDocument()

    const recover = screen.getByRole('button', { name: '발급 페이지로 이동' })
    fireEvent.pointerDown(recover, { pointerId: 1, isPrimary: true, button: 0 })
    expect(screen.getByRole('dialog', { name: '티켓 정보' }).dataset.dragging).not.toBe('true')
    fireEvent.click(recover)

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass'))
  })
})
