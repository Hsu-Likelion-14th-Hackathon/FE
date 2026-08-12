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
    document.documentElement.classList.remove('store-menu-open')
    document.body.classList.remove('store-menu-open')
  })

  it('renders the passport route', async () => {
    renderRoute('/boarding-pass/passport')

    expect(await screen.findByRole('heading', { name: 'MCM PASSPORT' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders the home scene with the original Figma raster assets', async () => {
    renderRoute('/')

    await screen.findByRole('link', { name: 'Boarding' })

    const scene = document.querySelector('section')
    const imageSources = [...scene.querySelectorAll('img')].map((image) => image.src)

    expect(imageSources).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/hero-plane\.png$/),
        expect.stringMatching(/\/hero-suitcase\.png$/),
        expect.stringMatching(/\/hero-watch\.png$/),
      ]),
    )
  })

  it('renders the Figma brand ornaments from their exported SVG assets', async () => {
    renderRoute('/')

    await screen.findByRole('link', { name: 'Boarding' })

    const ornaments = [...document.querySelectorAll('header [aria-hidden="true"] img')].map(
      (image) => decodeURIComponent(image.src),
    )

    expect(ornaments.filter((svg) => svg.includes("d='M14 8L8 15L2 8L8 1L14 8Z'"))).toHaveLength(2)
    expect(ornaments.filter((svg) => svg.includes("cx='2' cy='2' r='2'"))).toHaveLength(4)
  })

  it('keeps the boarding path from showing through the translucent button', async () => {
    renderRoute('/')

    const boardingLink = await screen.findByRole('link', { name: 'Boarding' })
    const flightPath = boardingLink.previousElementSibling
    const flightPathStyle = window.getComputedStyle(flightPath)

    expect(Number.parseFloat(flightPathStyle.borderBottomWidth || '0')).toBe(0)
  })

  it('renders a highlight on the boarding-pass brand text', async () => {
    renderRoute('/')

    await screen.findByRole('link', { name: 'Boarding' })

    const brandName = [...document.querySelectorAll('header span')].find(
      (element) => element.textContent === 'MCM BOARDING PASS',
    )

    const textShadow = window.getComputedStyle(brandName).textShadow

    expect(textShadow).toContain('0 1px 0 rgba(255, 255, 255, 0.1)')
    expect(textShadow).toContain('0 -1px 0 rgba(0, 0, 0, 0.14)')
  })

  it.each(routeCases)('%s 경로에서 %s 화면을 렌더링한다', async (pathname, heading) => {
    renderRoute(pathname)

    expect(
      await screen.findByRole('heading', { name: heading }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('공통 앱 화면을 데스크톱 디바이스 프레임 안에 렌더링한다', async () => {
    renderRoute('/')

    await screen.findByRole('heading', { name: '메인' })

    const appScreen = screen.getByRole('main')
    const deviceFrame = appScreen.closest('[data-device-frame]')

    expect(appScreen).toHaveAttribute('data-device-screen')
    expect(deviceFrame).toHaveAttribute('data-device-frame')
    expect(deviceFrame).toContainElement(appScreen)
  })

  it('동적 상품 경로에서 착용 화면을 열고 같은 상품 상세로 돌아간다', async () => {
    const router = renderRoute('/products/mcm-002')

    expect(
      await screen.findByRole('heading', { name: 'New Liz 비세토스 쇼퍼' }),
    ).toBeInTheDocument()

    const tryOnLink = screen.getByRole('link', { name: '착용하기' })
    expect(tryOnLink).toHaveAttribute('href', '/products/mcm-002/try-on')
    fireEvent.click(tryOnLink)

    expect(await screen.findByRole('heading', { name: '상품 착용' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products/mcm-002/try-on')

    fireEvent.click(screen.getByRole('button', { name: '상품 상세로 돌아가기' }))

    expect(
      await screen.findByRole('heading', { name: 'New Liz 비세토스 쇼퍼' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products/mcm-002')
  })

  it('찾을 수 없는 경로에서 메인으로 돌아간다', async () => {
    const router = renderRoute('/not-a-route')

    fireEvent.click(await screen.findByRole('link', { name: '메인으로 돌아가기' }))

    expect(await screen.findByRole('heading', { name: '메인' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('공통 메뉴 버튼으로 (3) 메뉴를 열고 다시 닫는다', async () => {
    renderRoute('/')

    const menuButton = await screen.findByRole('button', { name: '메뉴 열기' })
    const menu = document.getElementById('store-menu')

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menu).toHaveAttribute('data-state', 'closed')
    expect(menu).toHaveAttribute('aria-hidden', 'true')
    expect(menu).toHaveAttribute('inert')

    fireEvent.click(menuButton)

    const closeButton = screen.getByRole('button', { name: '메뉴 닫기' })

    expect(closeButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: '전체 메뉴' })).toHaveAttribute('aria-modal', 'true')
    expect(menu).toHaveAttribute('data-state', 'open')
    expect(menu).toHaveAttribute('aria-hidden', 'false')
    expect(menu).not.toHaveAttribute('inert')
    expect(screen.getByRole('navigation', { name: '전체 메뉴 탐색' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'MCM Boarding Pass 둘러보기' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('store-menu-open')
    expect(document.body).toHaveClass('store-menu-open')

    fireEvent.click(closeButton)

    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메뉴 열기' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(menu).toHaveAttribute('data-state', 'closed')
    expect(menu).toHaveAttribute('aria-hidden', 'true')
    expect(menu).toHaveAttribute('inert')
    expect(document.documentElement).not.toHaveClass('store-menu-open')
    expect(document.body).not.toHaveClass('store-menu-open')
  })

  it('메뉴 배경을 누르면 열린 메뉴를 닫는다', async () => {
    renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '메뉴 배경 닫기' }))

    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(document.getElementById('store-menu')).toHaveAttribute('data-state', 'closed')
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

    expect(firstLink).toHaveFocus()

    lastLink.focus()
    fireEvent.keyDown(lastLink, { key: 'Tab' })
    expect(firstLink).toHaveFocus()

    fireEvent.keyDown(firstLink, { key: 'Tab', shiftKey: true })
    expect(lastLink).toHaveFocus()
  })

  it('프로그램 방식으로 경로가 바뀌어도 열린 메뉴를 닫는다', async () => {
    const router = renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))

    await act(async () => {
      await router.navigate('/cart')
    })

    expect(await screen.findByRole('heading', { name: '쇼핑백' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(document.getElementById('store-menu')).toHaveAttribute('data-state', 'closed')
    expect(document.documentElement).not.toHaveClass('store-menu-open')
    expect(document.body).not.toHaveClass('store-menu-open')
  })
})
