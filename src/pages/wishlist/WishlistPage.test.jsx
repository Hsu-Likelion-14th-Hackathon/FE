import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Component } from './WishlistPage.jsx'

function renderWishlist() {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
}

describe('WishlistPage', () => {
  it('위시리스트 탭을 쇼핑백보다 왼쪽에 배치한다', () => {
    renderWishlist()

    const tabs = within(
      screen.getByRole('navigation', { name: '쇼핑백과 위시리스트' }),
    ).getAllByRole('link')

    expect(tabs.map((tab) => tab.textContent)).toEqual(['위시리스트', '쇼핑백'])
  })

  it('보고 있는 탭은 배경색 그대로 두고 반대쪽을 회색 박스로 눌러 둔다', () => {
    // Figma 71:1842 — 활성이 도려낸 것처럼 남고 비활성이 회색 박스다.
    renderWishlist()

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

  it('세 상품을 제거하면 빈 위시리스트 상태로 전환한다', () => {
    renderWishlist()

    expect(screen.getByText('위시리스트에 3개의 아이템이 있습니다')).toBeInTheDocument()

    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getAllByRole('button', { name: /위시리스트에서 삭제/ })[0])
    }

    expect(screen.getByText('비어 있습니다')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: '위시리스트 상품' })).not.toBeInTheDocument()
  })
})
