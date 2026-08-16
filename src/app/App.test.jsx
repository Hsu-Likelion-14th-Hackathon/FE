import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, setAccessToken } from '@/shared/api/authToken.js'

// 상품 상세는 서버에서 받아 온다. 통합 테스트는 라우팅을 보는 자리라
// 네트워크까지 실어 나르지 않는다.
vi.mock('@/shared/api/productApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getProduct: async (productId) => ({
    id: Number(productId),
    name: 'New Liz 비세토스 쇼퍼',
    price: 1050000,
    priceLabel: '₩1,050,000',
    description: '',
    colors: [
      {
        productColorId: 3,
        label: 'Beige + Black',
        hex: '#E0CEBB',
        isDefault: true,
        images: ['https://cdn/beige.jpg'],
        sizes: [{ productSizeId: 3, label: 'S', note: null, sku: 'A', stock: null }],
        isWished: false,
      },
    ],
  }),
}))

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

const storeHeaderRouteCases = [
  ['MCM 메인', '/', '메인'],
  ['위시리스트', '/wishlist', '위시리스트'],
  ['쇼핑백', '/cart', '쇼핑백'],
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
  beforeEach(() => {
    // 백엔드 데이터를 그리는 라우트는 보호 구간에 있다. 라우팅 검사가
    // 로그인 화면으로 튕기지 않도록 토큰을 쥐여 준다.
    setAccessToken('app-test-token')
  })

  afterEach(() => {
    clearAccessToken()
    activeRouters.splice(0).forEach((router) => router.dispose())
    document.documentElement.classList.remove('store-menu-open')
    document.body.classList.remove('store-menu-open')
  })

  it('renders the passport route', { timeout: 15_000 }, async () => {
    renderRoute('/boarding-pass/passport')

    expect(
      await screen.findByRole('heading', { name: 'MCM PASSPORT' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
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

    // 브랜드 스트립은 전광판처럼 흐르도록 텍스트를 여러 벌 두고,
    // 스크린리더용 sr-only 텍스트를 따로 둔다. 광택은 흐르는 쪽에 있다.
    const brandName = [...document.querySelectorAll('header span')].find(
      (element) =>
        element.textContent === 'MCM BOARDING PASS' &&
        window.getComputedStyle(element).backgroundImage !== '',
    )

    // 하이라이트는 text-shadow가 아니라 위→아래로 떨어지는 유리 광택을
    // 글자에 클리핑해서 낸다(Figma 52:13290).
    const style = window.getComputedStyle(brandName)

    // jsdom은 CSS 변수를 풀지 않고 var(...) 그대로 돌려준다.
    expect(style.backgroundImage).toBe('var(--mcm-gradient-header-title)')
    expect(style.backgroundClip).toBe('text')
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
    const router = renderRoute('/products/2')

    expect(
      await screen.findByRole('heading', { name: 'New Liz 비세토스 쇼퍼' }),
    ).toBeInTheDocument()

    const tryOnLink = screen.getByRole('link', { name: 'Fitting with Ai' })
    expect(tryOnLink).toHaveAttribute('href', '/products/2/try-on?color=3')
    fireEvent.click(tryOnLink)

    expect(await screen.findByRole('heading', { name: '상품 착용' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products/2/try-on')

    fireEvent.click(screen.getByRole('button', { name: '상품 상세로 돌아가기' }))

    expect(
      await screen.findByRole('heading', { name: 'New Liz 비세토스 쇼퍼' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products/2')
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

  it('보딩패스 Chrome 메뉴를 Escape로 닫으면 트리거에 포커스를 복원한다', async () => {
    renderRoute('/boarding-pass')
    const menuButton = await screen.findByRole('button', { name: '메뉴 열기' })

    fireEvent.click(menuButton)
    expect(screen.getByRole('dialog', { name: '전체 메뉴' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it.each(storeHeaderRouteCases)(
    '보딩패스 StoreHeader의 %s 링크가 %s로 이동한다',
    async (linkName, pathname, heading) => {
      const router = renderRoute('/boarding-pass')

      fireEvent.click(await screen.findByRole('link', { name: linkName }))

      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe(pathname)
    },
  )

  it('보딩패스 화면도 공통 StoreHeader를 쓰고 검색 glyph가 없다', async () => {
    renderRoute('/')
    await screen.findByRole('link', { name: 'Boarding' })
    expect(document.querySelectorAll('header svg')).toHaveLength(4)

    cleanup()
    renderRoute('/boarding-pass')
    const menuButton = await screen.findByRole('button', { name: '메뉴 열기' })
    const header = menuButton.closest('header')
    // 조작 요소는 타이틀 밴드·메뉴·로고·위시리스트·쇼핑백 5개뿐이어야 한다
    // (검색이 생기면 6개가 된다). 타이틀 밴드는 보딩패스로 들어가는 링크다.
    // 밴드 안의 점·마름모는 aria-hidden 장식이라 개수 검증 대상이 아니다.
    expect(header.querySelectorAll('a, button')).toHaveLength(5)
    expect(header.querySelector('[aria-label*="검색"]')).toBeNull()
  })

  it('타이틀 밴드를 누르면 보딩패스로 간다', async () => {
    const router = renderRoute('/products')

    // 흐르는 문구는 aria-hidden이라 링크 이름은 sr-only 텍스트가 맡는다.
    const band = await screen.findByRole('link', { name: 'MCM BOARDING PASS' })
    expect(band).toHaveAttribute('href', '/boarding-pass')

    fireEvent.click(band)
    // 라우터 이동은 비동기라 상태가 바로 바뀌지 않는다.
    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass'))
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

  it('메인 Boarding에서 보딩패스 랜딩에 진입한다', async () => {
    const router = renderRoute('/')

    fireEvent.click(await screen.findByRole('link', { name: 'Boarding' }))

    expect(await screen.findByRole('button', { name: '비행 시작하기' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('보딩패스 랜딩에서 비행 시작하기를 누르면 인트로를 거쳐 설문에 진입한다', async () => {
    const router = renderRoute('/boarding-pass')

    fireEvent.click(await screen.findByRole('button', { name: '비행 시작하기' }))
    expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass/intro')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(
      await screen.findByRole('button', { name: '이전' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass/survey')
  })

  it('로그인 없이 Passport를 누르면 로그인으로 보내고 돌아올 곳을 남긴다', async () => {
    clearAccessToken()
    const router = renderRoute('/boarding-pass')

    fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT 확인' }))

    expect(
      await screen.findByRole('heading', { name: '로그인' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state?.from).toBe('/boarding-pass/passport')
  })

  it('로그인한 사용자는 랜딩에서 Passport에 진입한다', async () => {
    const router = renderRoute('/boarding-pass')

    fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT 확인' }))

    expect(
      await screen.findByRole('heading', { name: 'MCM PASSPORT' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass/passport')
  })

  it('메뉴 Boarding으로 랜딩에 진입하고 메뉴를 닫는다', async () => {
    const router = renderRoute('/')

    fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))
    fireEvent.click(screen.getByRole('link', { name: 'MCM Boarding Pass 둘러보기' }))

    expect(await screen.findByRole('button', { name: '비행 시작하기' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass')
    expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('store-menu-open')
    expect(document.body).not.toHaveClass('store-menu-open')
  })
})
