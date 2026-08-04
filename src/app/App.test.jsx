import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { createAppRoutes } from './router.jsx'

const routeCases = [
  ['/', '메인'],
  ['/login', '로그인'],
  ['/signup', '회원가입'],
  ['/products', '상품 목록'],
  ['/products/mcm-001', '상품 상세'],
  ['/products/mcm-001/try-on', '상품 착용'],
  ['/wishlist', '위시리스트'],
  ['/cart', '쇼핑백'],
  ['/unknown', '페이지를 찾을 수 없습니다'],
  ['/products/mcm-001/unknown', '페이지를 찾을 수 없습니다'],
  ['/products//try-on', '페이지를 찾을 수 없습니다'],
]

const activeRouters = []

function renderRoute(pathname) {
  const router = createMemoryRouter(createAppRoutes(), {
    initialEntries: [pathname],
  })
  activeRouters.push(router)

  render(<RouterProvider router={router} />)

  return router
}

describe('App', () => {
  afterEach(() => {
    activeRouters.splice(0).forEach((router) => router.dispose())
    window.sessionStorage.clear()
    document.documentElement.classList.remove('store-menu-open')
    document.body.classList.remove('store-menu-open')
  })

  it.each(routeCases)('%s 경로에서 %s 화면을 렌더링한다', async (pathname, heading) => {
    renderRoute(pathname)

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('동적 상품 ID를 상세와 착용 화면에 전달한다', async () => {
    const detailRouter = renderRoute('/products/mcm-001')

    expect(await screen.findByText('상품 ID: mcm-001')).toBeInTheDocument()

    await act(async () => {
      await detailRouter.navigate('/products/mcm-002/try-on')
    })

    expect(await screen.findByRole('heading', { name: '상품 착용' })).toBeInTheDocument()
    expect(screen.getByText('상품 ID: mcm-002')).toBeInTheDocument()
  })

  it('찾을 수 없는 경로에서 메인으로 돌아간다', async () => {
    const router = renderRoute('/not-a-route')

    fireEvent.click(await screen.findByRole('link', { name: '메인으로 돌아가기' }))

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('이전 탑승 기록이 있어도 메인은 항상 (1) 랜딩 화면으로 시작한다', async () => {
    window.sessionStorage.setItem('mcm-boarding-complete', 'true')

    renderRoute('/')

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
  })

  it('공통 메뉴 버튼으로 (3) 메뉴를 열고 다시 닫는다', async () => {
    renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))

    expect(screen.getByRole('dialog', { name: '전체 메뉴' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('navigation', { name: '전체 메뉴 탐색' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'MCM Boarding Pass 둘러보기' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('store-menu-open')

    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))

    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('store-menu-open')
  })

  it('메뉴의 로그인 링크를 누르면 메뉴를 닫고 로그인 화면으로 이동한다', async () => {
    const router = renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))
    fireEvent.click(screen.getByRole('link', { name: '로그인' }))

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
  })

  it('Escape 키로 열린 메뉴를 닫는다', async () => {
    renderRoute('/products')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메뉴 열기' })).toHaveFocus()
  })

  it('열린 메뉴 안에서 Tab 포커스를 순환한다', async () => {
    renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))

    const firstLink = screen.getByRole('link', { name: 'MCM Boarding Pass 둘러보기' })
    const lastLink = screen.getByRole('link', { name: '로그인' })

    lastLink.focus()
    fireEvent.keyDown(lastLink, { key: 'Tab' })
    expect(firstLink).toHaveFocus()

    fireEvent.keyDown(firstLink, { key: 'Tab', shiftKey: true })
    expect(lastLink).toHaveFocus()
  })
})
