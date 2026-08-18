import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

const mockGetWishlist = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/wishlistApi.js', () => ({
  getWishlist: (...args) => mockGetWishlist(...args),
}))

import { Component } from './IntroPage.jsx'
import styles from './IntroPage.module.scss'

beforeEach(() => {
  // 기본은 담긴 상태 — 토스트 없음.
  mockGetWishlist.mockReset().mockResolvedValue([{ productColorId: 1 }])
})

function renderIntro(initialEntries = ['/boarding-pass/survey', '/boarding-pass/intro']) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Home</p> },
      { path: '/boarding-pass', element: <p>Landing</p> },
      { path: '/boarding-pass/intro', element: <Component /> },
      { path: '/boarding-pass/survey', element: <p>Survey</p> },
      { path: '/products', element: <p>Products</p> },
    ],
    { initialEntries },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('IntroPage', () => {
  it('위시리스트가 비어 있으면 진입만으로 빈 가방 토스트를 보여 준다', async () => {
    // 랜딩을 거치지 않고 들어온 사람도 발급 전에 알아야 한다 — 빈 가방으로
    // 발급하면 티켓에 담길 상품이 없다.
    mockGetWishlist.mockResolvedValue([])
    const router = renderIntro(['/boarding-pass/intro'])

    expect(await screen.findByText('위시리스트에 담긴 상품이 없습니다')).toBeInTheDocument()

    // 빈 화면은 초대다 — 토스트를 누르면 상품 목록으로 간다.
    fireEvent.click(screen.getByRole('button', { name: '상품 목록 보러가기' }))
    expect(router.state.location.pathname).toBe('/products')
  })

  it('위시리스트에 상품이 있으면 토스트 없이 조용하다', async () => {
    renderIntro(['/boarding-pass/intro'])

    await waitFor(() => expect(mockGetWishlist).toHaveBeenCalled())
    expect(screen.queryByText('위시리스트에 담긴 상품이 없습니다')).not.toBeInTheDocument()
  })

  it('위시리스트 확인이 실패해도 토스트를 띄우지 않는다', async () => {
    mockGetWishlist.mockRejectedValue(new Error('network down'))
    renderIntro(['/boarding-pass/intro'])

    await waitFor(() => expect(mockGetWishlist).toHaveBeenCalled())
    expect(screen.queryByText('위시리스트에 담긴 상품이 없습니다')).not.toBeInTheDocument()
  })

  it('보딩패스 영역을 화면 높이까지 채운다', () => {
    renderIntro(['/boarding-pass/intro'])

    expect(screen.getByRole('main')).toHaveClass(styles.page)
  })

  it('패스 카드 카피를 DOM 텍스트로 렌더한다', () => {
    renderIntro(['/boarding-pass/intro'])

    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('BOARDING PASS')).toBeInTheDocument()
    expect(screen.getByText('당신의 MCM HAUS 비행을 위한')).toBeInTheDocument()
  })

  it('닫기는 이전 설문이 아니라 보딩패스 랜딩으로 이동한다', () => {
    const router = renderIntro()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('닫기는 intro history를 교체해서 뒤로 가도 intro가 다시 열리지 않는다', async () => {
    const router = renderIntro(['/', '/boarding-pass', '/boarding-pass/intro'])

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(router.state.location.pathname).toBe('/boarding-pass')

    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/boarding-pass')
    expect(router.state.location.pathname).not.toBe('/boarding-pass/intro')
  })
})
