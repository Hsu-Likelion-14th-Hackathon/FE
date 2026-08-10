import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { Component } from './ProductListPage.jsx'

let router

function renderPage() {
  router = createMemoryRouter([{ path: '/products', Component }], {
    initialEntries: ['/products'],
  })

  render(<RouterProvider router={router} />)
}

describe('ProductListPage', () => {
  afterEach(() => router?.dispose())

  it('상품 상세 링크와 위시리스트 토글을 제공한다', () => {
    renderPage()

    expect(
      screen.getAllByRole('link', {
        name: 'New Liz 비세토스 쇼퍼, ₩1,050,000 상세 보기',
      })[0],
    ).toHaveAttribute('href', '/products/mcm-002')

    const wishlistButton = screen.getByRole('button', {
      name: 'Diamant 비세토스 3D 참 위시리스트에서 삭제',
    })

    fireEvent.click(wishlistButton)

    expect(wishlistButton).toHaveAttribute('aria-pressed', 'false')
    expect(wishlistButton).toHaveAccessibleName('Diamant 비세토스 3D 참 위시리스트에 추가')
  })
})
