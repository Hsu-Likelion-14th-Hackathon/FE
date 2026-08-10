import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { Component } from './ProductDetailPage.jsx'

let router

function renderPage() {
  router = createMemoryRouter([{ path: '/products/:productId', Component }], {
    initialEntries: ['/products/mcm-001'],
  })

  render(<RouterProvider router={router} />)
}

describe('ProductDetailPage', () => {
  afterEach(() => router?.dispose())

  it('색상을 선택하고 쇼핑백 추가 결과를 안내한다', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Diamant 비세토스 3D 참' })).toBeInTheDocument()
    expect(screen.queryByText(/상품 ID:/)).not.toBeInTheDocument()
    expect(screen.getByText('2개 남음')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cinnamon 색상 선택' }))

    expect(screen.getByText('5개 남음')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cinnamon 색상 선택' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('link', { name: '착용하기' })).toHaveAttribute(
      'href',
      '/products/mcm-001/try-on',
    )

    fireEvent.click(screen.getByRole('button', { name: '쇼핑백에 추가' }))

    expect(screen.getByRole('button', { name: '쇼핑백에 담겼어요' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Diamant 비세토스 3D 참 Cinnamon 색상이 쇼핑백에 추가되었습니다.',
    )
  })
})
