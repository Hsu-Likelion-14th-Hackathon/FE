import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getWishlist = vi.hoisted(() => vi.fn())
const removeFromWishlist = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/wishlistApi.js', () => ({
  getWishlist: (...args) => getWishlist(...args),
  removeFromWishlist: (...args) => removeFromWishlist(...args),
}))

import { Component } from './WishlistPage.jsx'

/** GET /wishlist 계약(WishlistItemResponse) 모양 그대로 둔다. */
const serverItems = [
  {
    productColorId: 1,
    productId: 1,
    name: 'Diamant 비세토스 3D 참',
    price: 490000,
    thumbnailImageUrl: 'https://cdn/soft-pink.jpg',
    colorName: 'Soft Pink',
  },
  {
    productColorId: 4,
    productId: 2,
    name: 'New Liz 비세토스 쇼퍼',
    price: 1050000,
    thumbnailImageUrl: null,
    colorName: 'Beige + Black',
  },
]

function renderWishlist() {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
}

async function renderLoadedWishlist() {
  renderWishlist()
  await screen.findByText('위시리스트에 2개의 아이템이 있습니다')
}

beforeEach(() => {
  getWishlist.mockReset().mockResolvedValue([...serverItems])
  removeFromWishlist.mockReset().mockResolvedValue(true)
})

describe('WishlistPage', () => {
  it('위시리스트 탭을 쇼핑백보다 왼쪽에 배치한다', async () => {
    await renderLoadedWishlist()

    const tabs = within(
      screen.getByRole('navigation', { name: '쇼핑백과 위시리스트' }),
    ).getAllByRole('link')

    expect(tabs.map((tab) => tab.textContent)).toEqual(['위시리스트', '쇼핑백'])
  })

  it('보고 있는 탭은 배경색 그대로 두고 반대쪽을 회색 박스로 눌러 둔다', async () => {
    // Figma 71:1842 — 활성이 도려낸 것처럼 남고 비활성이 회색 박스다.
    await renderLoadedWishlist()

    const tabs = within(screen.getByRole('navigation', { name: '쇼핑백과 위시리스트' }))
    const wishlistTab = tabs.getByRole('link', { name: '위시리스트' })
    const cartTab = tabs.getByRole('link', { name: '쇼핑백' })

    expect(wishlistTab).toHaveAttribute('aria-current', 'page')
    expect(window.getComputedStyle(wishlistTab).color).toBe('var(--mcm-color-brand-brown)')
    expect(window.getComputedStyle(wishlistTab).backgroundColor).toBe('var(--mcm-color-canvas)')
    expect(window.getComputedStyle(cartTab).color).toBe('var(--mcm-color-muted)')
    // jsdom이 hex를 rgb로 정규화한다.
    expect(window.getComputedStyle(cartTab).backgroundColor).toBe('rgb(230, 230, 230)')
  })

  it('서버 목록을 이름·₩ 가격·상세 링크로 그린다', async () => {
    await renderLoadedWishlist()

    expect(screen.getByText('Diamant 비세토스 3D 참')).toBeInTheDocument()
    expect(screen.getByText('₩490,000')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Diamant 비세토스 3D 참 상세 보기' })).toHaveAttribute(
      'href',
      '/products/1',
    )
    expect(screen.getByText('₩1,050,000')).toBeInTheDocument()
  })

  it('하트를 누르면 productColorId로 삭제를 요청하고, 모두 지우면 빈 상태가 된다', async () => {
    await renderLoadedWishlist()

    fireEvent.click(screen.getByRole('button', { name: 'Diamant 비세토스 3D 참 위시리스트에서 삭제' }))

    expect(removeFromWishlist).toHaveBeenCalledWith(1)
    expect(screen.queryByText('Diamant 비세토스 3D 참')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New Liz 비세토스 쇼퍼 위시리스트에서 삭제' }))

    expect(screen.getByText('비어 있습니다')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: '위시리스트 상품' })).not.toBeInTheDocument()
  })

  it('삭제가 실패하면 항목을 제자리에 되돌린다', async () => {
    removeFromWishlist.mockRejectedValue(new Error('네트워크 오류'))
    await renderLoadedWishlist()

    fireEvent.click(screen.getByRole('button', { name: 'Diamant 비세토스 3D 참 위시리스트에서 삭제' }))
    expect(screen.queryByText('Diamant 비세토스 3D 참')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Diamant 비세토스 3D 참')).toBeInTheDocument())
    // 되돌아온 자리도 원래 첫 칸이다.
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Diamant 비세토스 3D 참')
  })

  it('로그인이 없어 401이 오면 로그인 링크를 보여 준다', async () => {
    getWishlist.mockRejectedValue(Object.assign(new Error('인증이 필요합니다.'), { status: 401 }))
    renderWishlist()

    expect(await screen.findByRole('alert')).toHaveTextContent('위시리스트를 보려면 로그인이 필요합니다.')
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/login')
  })
})
