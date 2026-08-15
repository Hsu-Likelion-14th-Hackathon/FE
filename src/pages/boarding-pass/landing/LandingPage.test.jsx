import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

const mockGetLatestBoardingPass = vi.hoisted(() => vi.fn())
const mockGetWishlist = vi.hoisted(() => vi.fn())
const mockGetShoppingBag = vi.hoisted(() => vi.fn())
const activeRouters = []

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getLatestBoardingPass: mockGetLatestBoardingPass,
}))

vi.mock('@/shared/api/wishlistApi.js', () => ({
  getWishlist: mockGetWishlist,
}))

vi.mock('@/shared/api/shoppingBagApi.js', () => ({
  getShoppingBag: mockGetShoppingBag,
}))

import { Component as LandingPage } from './LandingPage.jsx'

function renderLanding() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass', Component: LandingPage },
      { path: '/boarding-pass/intro', element: <p>Intro</p> },
      { path: '/boarding-pass/survey', element: <p>Survey</p> },
      { path: '/boarding-pass/scan', element: <p>Scan</p> },
      { path: '/boarding-pass/passport', element: <p>Passport</p> },
      { path: '/wishlist', element: <h1>위시리스트</h1> },
      { path: '/cart', element: <h1>쇼핑백</h1> },
      { path: '/products', element: <h1>상품 목록</h1> },
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
  beforeEach(() => {
    // 랜딩은 진입 시 위시리스트를 확인한다. 기본은 담긴 상태 — 토스트 없음.
    mockGetWishlist.mockResolvedValue([{ productColorId: 1 }])
  })

  afterEach(() => {
    activeRouters.splice(0).forEach((router) => router.dispose())
    mockGetLatestBoardingPass.mockReset()
    mockGetWishlist.mockReset()
    mockGetShoppingBag.mockReset()
  })

  it('routes guests to intro from the start flight button', async () => {
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('button', { name: '비행 시작하기' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/intro'))
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

  it('위시리스트가 비어 있으면 진입만으로 빈 가방 토스트를 보여 준다', async () => {
    mockGetWishlist.mockResolvedValue([])
    const router = renderLanding()

    // 아무것도 누르지 않아도 초대가 먼저 도착한다.
    expect(await screen.findByText('위시리스트에 담긴 상품이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('눌러서 상품을 담으러 가기')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass')

    // 빈 화면은 초대다 — 토스트를 누르면 상품 목록으로 간다.
    fireEvent.click(screen.getByRole('button', { name: '상품 목록 보러가기' }))
    expect(router.state.location.pathname).toBe('/products')
  })

  it('위시리스트에 상품이 있으면 토스트 없이 조용하다', async () => {
    renderLanding()

    await waitFor(() => expect(mockGetWishlist).toHaveBeenCalled())
    expect(screen.queryByText('위시리스트에 담긴 상품이 없습니다')).not.toBeInTheDocument()
  })

  it('위시리스트 확인이 실패해도(비로그인 등) 토스트를 띄우지 않는다', async () => {
    mockGetWishlist.mockRejectedValue(new Error('401'))
    renderLanding()

    await waitFor(() => expect(mockGetWishlist).toHaveBeenCalled())
    expect(screen.queryByText('위시리스트에 담긴 상품이 없습니다')).not.toBeInTheDocument()
  })

  it('헤더 위시리스트·쇼핑백 아이콘은 바로 해당 화면으로 이동한다', async () => {
    const router = renderLanding()

    fireEvent.click(await screen.findByRole('link', { name: '위시리스트' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/wishlist'))

    await router.navigate('/boarding-pass')
    fireEvent.click(await screen.findByRole('link', { name: '쇼핑백' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/cart'))
  })
})
