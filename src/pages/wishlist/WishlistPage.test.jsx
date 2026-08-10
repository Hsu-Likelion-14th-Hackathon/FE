import { fireEvent, render, screen } from '@testing-library/react'
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
