import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getLatestBoardingPass = vi.hoisted(() => vi.fn())
const completeBoardingPass = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getLatestBoardingPass: (...args) => getLatestBoardingPass(...args),
  completeBoardingPass: (...args) => completeBoardingPass(...args),
}))

import AppProviders from '@/app/providers.jsx'
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
      { path: '/boarding-pass/passport', element: <p>Passport</p> },
    ],
    { initialEntries: ['/boarding-pass/flight'] },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  activeRouters.push(router)
  return router
}

describe('FlightPage', () => {
  beforeEach(() => {
    getLatestBoardingPass.mockReset().mockResolvedValue(null)
    completeBoardingPass.mockReset().mockResolvedValue({
      boardingPassId: 7,
      status: 'COMPLETED',
      stayMinutes: 46,
      passportStampId: 7,
      totalVisitCount: 1,
    })
  })

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

  it('\uBCF4\uB529\uD328\uC2A4\uAC00 \uC5C6\uC73C\uBA74 \uBE44\uD589 \uC885\uB8CC\uAC00 \uB79C\uB529\uC73C\uB85C \uB3CC\uC544\uAC04\uB2E4', async () => {
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '\uBE44\uD589 \uC885\uB8CC' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass'))
    expect(completeBoardingPass).not.toHaveBeenCalled()
  })

  it('\uBE44\uD589 \uC885\uB8CC\uAC00 \uC11C\uBC84\uC5D0 \uC885\uB8CC\uB97C \uC54C\uB9AC\uACE0 \uC5EC\uAD8C\uC73C\uB85C \uBCF4\uB0B8\uB2E4', async () => {
    // \uC774\uB54C \uBC29\uBB38\uC774 \uD655\uC815\uB418\uC5B4 \uC5EC\uAD8C \uC2A4\uD0EC\uD504\uAC00 \uC0DD\uAE34\uB2E4.
    getLatestBoardingPass.mockResolvedValue({ boardingPassId: 7, passengerName: 'HYKIM' })
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '\uBE44\uD589 \uC885\uB8CC' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/passport'))
    expect(completeBoardingPass).toHaveBeenCalledWith(7)
  })

  it('\uC885\uB8CC\uAC00 \uC2E4\uD328\uD558\uBA74 \uC0AC\uC720\uB97C \uD1A0\uC2A4\uD2B8\uB85C \uC54C\uB9AC\uACE0 \uD654\uBA74\uC5D0 \uBA38\uBB38\uB2E4', async () => {
    getLatestBoardingPass.mockResolvedValue({ boardingPassId: 7 })
    completeBoardingPass.mockRejectedValue(
      new Error('\uC774\uBBF8 \uC885\uB8CC\uB41C \uBE44\uD589\uC785\uB2C8\uB2E4.'),
    )
    const router = renderFlight()

    fireEvent.click(await screen.findByRole('button', { name: '\uBE44\uD589 \uC885\uB8CC' }))

    expect(
      await screen.findByText('\uC774\uBBF8 \uC885\uB8CC\uB41C \uBE44\uD589\uC785\uB2C8\uB2E4.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass/flight')
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
