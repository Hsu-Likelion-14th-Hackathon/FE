import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'
import { Component as PassportPage } from './PassportPage.jsx'

vi.mock('@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx', () => ({
  useBagHandlers: () => ({}),
}))

function renderPassport() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/passport', Component: PassportPage },
      { path: '/boarding-pass', element: <p>Boarding</p> },
      { path: '/products', element: <p>Products</p> },
    ],
    { initialEntries: ['/boarding-pass/passport'] },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('PassportPage', () => {
  it('25%에서 시작해 네 단계 사이만 이동한다', () => {
    renderPassport()

    const progress = screen.getByRole('progressbar', { name: '여권 진행률' })
    expect(progress).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByRole('button', { name: '이전 단계' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(progress).toHaveAttribute('aria-valuenow', '50')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(progress).toHaveAttribute('aria-valuenow', '75')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(progress).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '상품 보러가기' })).toBeInTheDocument()
  })
})
