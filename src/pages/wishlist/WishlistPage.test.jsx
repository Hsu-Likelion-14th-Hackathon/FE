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

  it('선택된 위시리스트 탭만 주황 배경으로 표시한다', () => {
    renderWishlist()

    const tabs = within(screen.getByRole('navigation', { name: '쇼핑백과 위시리스트' }))
    const wishlistTab = tabs.getByRole('link', { name: '위시리스트' })
    const cartTab = tabs.getByRole('link', { name: '쇼핑백' })

    expect(wishlistTab).toHaveAttribute('aria-current', 'page')
    expect(window.getComputedStyle(wishlistTab).color).toBe('var(--mcm-color-canvas)')
    expect(window.getComputedStyle(wishlistTab).backgroundColor).toBe(
      'var(--mcm-color-brand-brown)',
    )
    expect(window.getComputedStyle(cartTab).color).toBe('var(--mcm-color-ink)')
    expect(window.getComputedStyle(cartTab).backgroundColor).toBe('var(--mcm-color-canvas)')
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
