import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import AppProviders from '@/app/providers.jsx'

import { Component as GuidePage } from './GuidePage.jsx'

const activeRouters = []

function renderGuide() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/guide', Component: GuidePage },
      { path: '/boarding-pass/flight', element: <p>Flight</p> },
    ],
    { initialEntries: ['/boarding-pass/guide'] },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  activeRouters.push(router)
  return router
}

describe('GuidePage', { timeout: 15_000 }, () => {
  afterEach(() => {
    activeRouters.splice(0).forEach((router) => router.dispose())
  })

  it('opens 5F ARRIVE from the overview chip', { timeout: 15_000 }, () => {
    renderGuide()

    fireEvent.click(screen.getByRole('button', { name: /5F ARRIVE/ }))

    expect(screen.getByText('1976년, München')).toBeInTheDocument()
    expect(screen.getByText(/밤의 도시가 낳은 대담함/)).toBeInTheDocument()
    expect(screen.getByText('MCM의 여정은 끝이 아닙니다')).toBeInTheDocument()
  })

  it('reaches 5F after 1F, 2F, and 3F', () => {
    renderGuide()

    const next = screen.getByRole('button', { name: '다음' })
    fireEvent.click(next)
    expect(screen.getByText(/미하엘 크로머가 처음에 만든 것은 가방이 아닌/)).toBeInTheDocument()

    fireEvent.click(next)
    expect(screen.getByText('LAUREL & VISETOS')).toBeInTheDocument()

    fireEvent.click(next)
    expect(screen.getByText(/2026년 반세기를 걸어온 MCM은 다시/)).toBeInTheDocument()

    fireEvent.click(next)
    expect(screen.getByText('1976년, München')).toBeInTheDocument()
    expect(next).toBeDisabled()
  })
})
