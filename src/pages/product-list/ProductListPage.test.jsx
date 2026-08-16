import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getProducts = vi.hoisted(() => vi.fn())
const addToWishlist = vi.hoisted(() => vi.fn())
const removeFromWishlist = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/productApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getProducts: (...args) => getProducts(...args),
}))

vi.mock('@/shared/api/wishlistApi.js', () => ({
  addToWishlist: (...args) => addToWishlist(...args),
  removeFromWishlist: (...args) => removeFromWishlist(...args),
}))

import { Component } from './ProductListPage.jsx'

/** 백엔드 목록은 색 단위다. 같은 productId가 두 줄로 내려온다. */
const rows = [
  {
    id: 1,
    productColorId: 1,
    name: 'Diamant 비세토스 3D 참',
    price: 490000,
    priceLabel: '₩490,000',
    thumbnailImageUrl: 'https://cdn/soft-pink.jpg',
    colors: [
      { productColorId: 1, label: 'Soft Pink', hex: '#F4BFC5', isDefault: true },
      { productColorId: 2, label: 'Cinnamon', hex: '#7E3F47', isDefault: false },
    ],
    isWished: true,
  },
  {
    id: 2,
    productColorId: 3,
    name: 'New Liz 비세토스 쇼퍼',
    price: 1050000,
    priceLabel: '₩1,050,000',
    thumbnailImageUrl: 'https://cdn/beige.jpg',
    colors: [{ productColorId: 3, label: 'Beige + Black', hex: '#E0CEBB', isDefault: true }],
    isWished: false,
  },
]

let router

function renderPage() {
  router = createMemoryRouter([{ path: '/products', Component }], {
    initialEntries: ['/products'],
  })

  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  getProducts.mockReset().mockResolvedValue(rows)
  addToWishlist.mockReset().mockResolvedValue({})
  removeFromWishlist.mockReset().mockResolvedValue(true)
})

afterEach(() => router?.dispose())

describe('ProductListPage', () => {
  it('접근성 제목을 화면에서 숨긴다', async () => {
    renderPage()

    for (const heading of [
      screen.getByRole('heading', { level: 1, name: '상품 목록' }),
      screen.getByRole('heading', { level: 2, name: 'Autumn Winter 2026' }),
    ]) {
      const style = window.getComputedStyle(heading)
      expect(style.position).toBe('absolute')
      expect(style.width).toBe('1px')
      expect(style.height).toBe('1px')
      expect(style.overflow).toBe('hidden')
    }

    await screen.findByRole('link', { name: /New Liz/ })
  })

  it('상세 링크에 백엔드 productId를 쓴다', async () => {
    renderPage()

    // 예전에는 `mcm-002` 같은 로컬 문자열이었다. 서버는 숫자를 준다.
    expect(
      await screen.findByRole('link', { name: 'New Liz 비세토스 쇼퍼, ₩1,050,000 상세 보기' }),
    ).toHaveAttribute('href', '/products/2')
  })

  it('서버가 준 위시 상태로 하트를 칠한다', async () => {
    renderPage()

    expect(
      await screen.findByRole('button', { name: 'Diamant 비세토스 3D 참 위시리스트에서 삭제' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'New Liz 비세토스 쇼퍼 위시리스트에 추가' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('하트를 누르면 productColorId로 담고 즉시 칠한다', async () => {
    renderPage()

    const button = await screen.findByRole('button', {
      name: 'New Liz 비세토스 쇼퍼 위시리스트에 추가',
    })
    fireEvent.click(button)

    // productId(2)가 아니라 productColorId(3)여야 한다.
    expect(addToWishlist).toHaveBeenCalledWith(3)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('이미 담긴 것을 누르면 뺀다', async () => {
    renderPage()

    const button = await screen.findByRole('button', {
      name: 'Diamant 비세토스 3D 참 위시리스트에서 삭제',
    })
    fireEvent.click(button)

    expect(removeFromWishlist).toHaveBeenCalledWith(1)
    expect(addToWishlist).not.toHaveBeenCalled()
  })

  it('담기에 실패하면 하트를 되돌린다', async () => {
    // 되돌리지 않으면 담기지 않은 것이 담긴 것처럼 남는다.
    addToWishlist.mockRejectedValue(new Error('네트워크 오류'))
    renderPage()

    const button = await screen.findByRole('button', {
      name: 'New Liz 비세토스 쇼퍼 위시리스트에 추가',
    })
    fireEvent.click(button)

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
  })

  it('로그인이 필요하면 로그인 링크를 보여 준다', async () => {
    getProducts.mockRejectedValue(Object.assign(new Error('인증이 필요합니다'), { status: 401 }))
    renderPage()

    // 탑승 안내 카드 — CHECK-IN 라벨과 로그인 CTA가 함께 나온다.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Check-in')
    expect(alert).toHaveTextContent('로그인이 필요한 공간입니다')
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/login')
  })

  it('그 밖의 실패는 백엔드 메시지를 그대로 보여 준다', async () => {
    getProducts.mockRejectedValue(
      Object.assign(new Error('서버가 응답하지 않습니다'), { status: 500 }),
    )
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('서버가 응답하지 않습니다')
  })
})
