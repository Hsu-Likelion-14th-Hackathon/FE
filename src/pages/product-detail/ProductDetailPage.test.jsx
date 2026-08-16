import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getProduct = vi.hoisted(() => vi.fn())
const addToShoppingBag = vi.hoisted(() => vi.fn())
const addToWishlist = vi.hoisted(() => vi.fn())
const removeFromWishlist = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/productApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getProduct: (...args) => getProduct(...args),
}))

vi.mock('@/shared/api/shoppingBagApi.js', () => ({
  addToShoppingBag: (...args) => addToShoppingBag(...args),
}))

vi.mock('@/shared/api/wishlistApi.js', () => ({
  addToWishlist: (...args) => addToWishlist(...args),
  removeFromWishlist: (...args) => removeFromWishlist(...args),
}))

import { Component } from './ProductDetailPage.jsx'

/** 백엔드는 색 안에 이미지와 사이즈를 중첩해 준다. */
const detail = {
  id: 1,
  name: 'Diamant 비세토스 3D 참',
  price: 490000,
  priceLabel: '₩490,000',
  description: '상품 설명',
  colors: [
    {
      productColorId: 1,
      label: 'Soft Pink',
      hex: '#F4BFC5',
      isDefault: true,
      images: ['https://cdn/pink-1.jpg', 'https://cdn/pink-2.jpg'],
      sizes: [{ productSizeId: 11, label: '프리 사이즈', note: null, sku: 'A', stock: 2 }],
      isWished: false,
    },
    {
      productColorId: 2,
      label: 'Cinnamon',
      hex: '#7E3F47',
      isDefault: false,
      images: ['https://cdn/cinnamon-1.jpg'],
      sizes: [{ productSizeId: 12, label: '프리 사이즈', note: null, sku: 'B', stock: 5 }],
      isWished: true,
    },
  ],
}

let router

function renderPage() {
  router = createMemoryRouter([{ path: '/products/:productId', Component }], {
    initialEntries: ['/products/1'],
  })

  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  getProduct.mockReset().mockResolvedValue(detail)
  addToShoppingBag.mockReset().mockResolvedValue({ shoppingBagItemId: 99 })
  addToWishlist.mockReset().mockResolvedValue({})
  removeFromWishlist.mockReset().mockResolvedValue(true)
})

afterEach(() => router?.dispose())

describe('ProductDetailPage', () => {
  it('페이지 제목을 화면에서 숨기고 접근성 이름은 유지한다', async () => {
    renderPage()

    const heading = screen.getByRole('heading', { level: 1, name: '상품 상세' })
    const style = window.getComputedStyle(heading)

    expect(style.position).toBe('absolute')
    expect(style.width).toBe('1px')
    expect(style.height).toBe('1px')
    expect(style.overflow).toBe('hidden')

    await screen.findByRole('heading', { name: 'Diamant 비세토스 3D 참' })
  })

  it('색을 바꾸면 그 색의 재고와 사진으로 갈아탄다', async () => {
    renderPage()

    expect(await screen.findByText('2개 남음')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cinnamon 색상 선택' }))

    expect(screen.getByText('5개 남음')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cinnamon 색상 선택' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('화살표가 색 경계를 넘어 이어서 넘긴다', async () => {
    // 실서버 상품은 색마다 사진이 한 장씩이다. 색 안에서만 넘기면 화살표가
    // 죽어 버린다. Soft Pink 2장 + Cinnamon 1장 = 3칸이 한 줄로 이어진다.
    renderPage()

    const next = await screen.findByRole('button', { name: '다음 상품 이미지' })
    expect(next).toBeEnabled()

    // 1칸: Soft Pink 두 번째 사진 — 아직 색은 그대로다.
    fireEvent.click(next)
    expect(screen.getByText('Soft Pink')).toBeInTheDocument()

    // 2칸: Cinnamon으로 넘어간다.
    fireEvent.click(next)
    expect(screen.getByText('Cinnamon')).toBeInTheDocument()
    expect(screen.getByText('5개 남음')).toBeInTheDocument()

    // 3칸: 처음으로 돌아온다.
    fireEvent.click(next)
    expect(screen.getByText('Soft Pink')).toBeInTheDocument()
    expect(screen.getByText('2개 남음')).toBeInTheDocument()
  })

  it('넘길 곳이 없으면 화살표를 잠근다', async () => {
    getProduct.mockResolvedValue({
      ...detail,
      colors: [{ ...detail.colors[0], images: ['https://cdn/only.jpg'] }],
    })
    renderPage()

    expect(await screen.findByRole('button', { name: '다음 상품 이미지' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '이전 상품 이미지' })).toBeDisabled()
  })

  it('옆으로 쓸면 넘어가고, 아래로 쓸면 넘어가지 않는다', async () => {
    renderPage()

    await screen.findByRole('heading', { name: 'Diamant 비세토스 3D 참' })
    const media = document.querySelector('[class*="productMedia"]')

    const swipe = (fromX, fromY, toX, toY) => {
      fireEvent.touchStart(media, { touches: [{ clientX: fromX, clientY: fromY }] })
      fireEvent.touchEnd(media, { changedTouches: [{ clientX: toX, clientY: toY }] })
    }

    // 왼쪽으로 크게 쓸면 다음 칸.
    swipe(300, 100, 200, 110)
    expect(screen.getByText('Soft Pink')).toBeInTheDocument()
    swipe(300, 100, 200, 110)
    expect(screen.getByText('Cinnamon')).toBeInTheDocument()

    // 오른쪽으로 쓸면 되돌아온다.
    swipe(200, 100, 300, 110)
    expect(screen.getByText('Soft Pink')).toBeInTheDocument()

    // 세로로 더 많이 움직였으면 페이지를 내리려던 손짓이다.
    swipe(300, 100, 240, 300)
    expect(screen.getByText('Soft Pink')).toBeInTheDocument()

    // 너무 짧게 쓸면 탭이 미끄러진 것으로 본다.
    swipe(300, 100, 275, 100)
    expect(screen.getByText('Soft Pink')).toBeInTheDocument()
  })

  it('쇼핑백에는 색이 아니라 사이즈 번호를 보낸다', async () => {
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Cinnamon 색상 선택' }))
    fireEvent.click(screen.getByRole('button', { name: '쇼핑백에 추가' }))

    // productColorId(2)가 아니라 productSizeId(12)여야 한다.
    await waitFor(() => expect(addToShoppingBag).toHaveBeenCalledWith(12))
    expect(await screen.findByRole('button', { name: '쇼핑백에 담겼어요' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Diamant 비세토스 3D 참 Cinnamon 색상이 쇼핑백에 추가되었습니다.',
    )
  })

  it('담기는 요청이 끝나기 전 재탭을 무시한다', async () => {
    // 실서버는 같은 사이즈를 기존 항목에 합친다 — 더블 탭이 그대로 수량 2가 된다.
    let resolveAdd
    addToShoppingBag.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAdd = resolve
        }),
    )
    renderPage()

    const button = await screen.findByRole('button', { name: '쇼핑백에 추가' })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    resolveAdd({ shoppingBagItemId: 99 })
    expect(await screen.findByRole('button', { name: '쇼핑백에 담겼어요' })).toBeInTheDocument()
    expect(addToShoppingBag).toHaveBeenCalledTimes(1)
  })

  it('쇼핑백 담기에 실패하면 사유를 보여 준다', async () => {
    addToShoppingBag.mockRejectedValue(new Error('재고가 없습니다'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '쇼핑백에 추가' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('재고가 없습니다')
  })

  it('위시는 고른 색에만 붙는다', async () => {
    renderPage()

    // 첫 색(Soft Pink)은 담기지 않은 상태다.
    const heart = await screen.findByRole('button', { name: '위시리스트에 상품 추가' })
    fireEvent.click(heart)

    expect(addToWishlist).toHaveBeenCalledWith(1)

    // 두 번째 색은 서버가 이미 담겼다고 알려 줬다.
    fireEvent.click(screen.getByRole('button', { name: 'Cinnamon 색상 선택' }))
    fireEvent.click(screen.getByRole('button', { name: '위시리스트에 저장된 상품 삭제' }))

    expect(removeFromWishlist).toHaveBeenCalledWith(2)
  })

  it('재고가 0이면 품절로 잠근다', async () => {
    getProduct.mockResolvedValue({
      ...detail,
      colors: [{ ...detail.colors[0], sizes: [{ ...detail.colors[0].sizes[0], stock: 0 }] }],
    })
    renderPage()

    const button = await screen.findByRole('button', { name: '품절' })
    expect(button).toBeDisabled()
    expect(screen.getByText('0개 남음')).toBeInTheDocument()
  })

  it('재고가 미확정(null)이면 품절로 잠근다', async () => {
    // 백엔드 확답(2026-08-16): stock null은 "재고 미확정/품절"이다.
    getProduct.mockResolvedValue({
      ...detail,
      colors: [{ ...detail.colors[0], sizes: [{ ...detail.colors[0].sizes[0], stock: null }] }],
    })
    renderPage()

    const button = await screen.findByRole('button', { name: '품절' })
    expect(button).toBeDisabled()
    // 개수는 모른다 — "0개 남음"이라고 말하지 않는다.
    expect(screen.queryByText(/개 남음/)).not.toBeInTheDocument()
  })

  it('AI 피팅 링크에 백엔드 productId와 보고 있는 색을 쓴다', async () => {
    renderPage()

    // 피팅은 색 단위(productColorId)다. 초기에는 대표색이 실린다.
    const link = await screen.findByRole('link', { name: 'Fitting with Ai' })
    expect(link).toHaveAttribute('href', '/products/1/try-on?color=1')

    // 색을 바꾸면 링크도 그 색을 따라간다.
    fireEvent.click(screen.getByRole('button', { name: 'Cinnamon 색상 선택' }))
    expect(link).toHaveAttribute('href', '/products/1/try-on?color=2')
  })

  it('없는 상품이면 목록으로 돌아갈 길을 준다', async () => {
    getProduct.mockResolvedValue(null)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('요청한 상품을 찾을 수 없습니다')
    expect(screen.getByRole('link', { name: '상품 목록으로 돌아가기' })).toBeInTheDocument()
  })
})
