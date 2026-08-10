import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Component } from './CartPage.jsx'

function renderCart() {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
}

describe('CartPage', () => {
  it('상품 선택을 토글하고 모두 삭제하면 빈 쇼핑백 상태로 전환한다', () => {
    renderCart()

    const firstSelection = screen.getByRole('button', { name: 'Pina 비세토스 탬버린 백 선택' })
    const secondSelection = screen.getByRole('button', {
      name: '모노그램 프린트 러버 슬라이드 선택',
    })

    expect(firstSelection).toHaveAttribute('aria-pressed', 'true')
    expect(secondSelection).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(secondSelection)
    expect(secondSelection).toHaveAttribute('aria-pressed', 'true')

    for (let index = 0; index < 2; index += 1) {
      fireEvent.click(screen.getAllByRole('button', { name: /쇼핑백에서 삭제/ })[0])
    }

    expect(screen.getByText('나의 쇼핑백 (0개 품목)')).toBeInTheDocument()
    expect(screen.getByText('쇼핑백이 비어 있습니다')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '결제하기' })).not.toBeInTheDocument()
  })
})
