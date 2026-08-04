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
})
