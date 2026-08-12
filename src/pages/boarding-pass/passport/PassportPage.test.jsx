import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  return router
}

describe('PassportPage', () => {
  it('여행 기록에서 1F 상세와 티켓을 열고 Escape로 닫는다', async () => {
    renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const historyTrigger = screen.getByRole('button', { name: '여행 기록 보기' })
    fireEvent.click(historyTrigger)
    expect(screen.getByRole('dialog', { name: '여행 기록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }))
    expect(screen.getByRole('dialog', { name: '1F JOURNEY 상세' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '티켓 보기' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: '티켓 보기' }))
    expect(screen.getByRole('dialog', { name: '탑승권' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(historyTrigger).toHaveFocus())
  })

  it('시트가 열린 동안 Chrome과 콘텐츠를 inert로 만들고 상단 닫기는 시트만 닫는다', async () => {
    const router = renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const historyTrigger = screen.getByRole('button', { name: '여행 기록 보기' })
    fireEvent.click(historyTrigger)
    expect(screen.getByRole('progressbar').closest('[inert]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메뉴' }).closest('[inert]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '닫기' }).closest('[inert]')).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }), {
      key: 'Tab',
    })
    expect(screen.getByRole('button', { name: '메뉴' }).closest('[inert]')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass/passport')
    await waitFor(() => expect(historyTrigger).toHaveFocus())
  })

  it('시트 배경을 클릭하면 닫고 원래 트리거에 포커스를 복원한다', async () => {
    renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const historyTrigger = screen.getByRole('button', { name: '여행 기록 보기' })
    fireEvent.click(historyTrigger)
    fireEvent.click(screen.getByRole('button', { name: '시트 배경 닫기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(historyTrigger).toHaveFocus())
  })

  it('시트가 없을 때 상단 닫기는 보딩패스로 이동한다', () => {
    const router = renderPassport()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

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

  it('각 여권 단계를 보이고 이전 단계로 돌아간다', () => {
    renderPassport()

    expect(screen.getByRole('region', { name: '여권 표지' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('region', { name: '여권 프로필' })).toHaveTextContent('MCM 2026 0805')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('region', { name: '여권 방문 스탬프' })).toHaveTextContent(
      '총 방문 횟수 6회',
    )
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('region', { name: '여권 여행 기록' })).toHaveTextContent('AI FITTING')

    fireEvent.click(screen.getByRole('button', { name: '이전 단계' }))
    expect(screen.getByRole('progressbar', { name: '여권 진행률' })).toHaveAttribute(
      'aria-valuenow',
      '75',
    )
    expect(screen.getByRole('region', { name: '여권 방문 스탬프' })).toBeInTheDocument()
  })

  it('닫기 버튼으로 보딩패스 경로로 이동한다', () => {
    const router = renderPassport()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('상품 보러가기 버튼으로 상품 경로로 이동한다', () => {
    const router = renderPassport()

    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    }
    fireEvent.click(screen.getByRole('button', { name: '상품 보러가기' }))
    expect(router.state.location.pathname).toBe('/products')
  })

  it('키보드로 다음 단계로 이동하고 닫기 버튼에 44px 터치 영역을 준다', () => {
    renderPassport()

    const next = screen.getByRole('button', { name: '다음 단계' })
    next.focus()
    fireEvent.keyDown(next, { key: 'Enter' })
    expect(screen.getByRole('progressbar', { name: '여권 진행률' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
    expect(window.getComputedStyle(screen.getByRole('button', { name: '닫기' })).width).toBe(
      '2.75rem',
    )
  })
})
