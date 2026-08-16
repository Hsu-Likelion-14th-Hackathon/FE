import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EmptyBagToast from './EmptyBagToast.jsx'

describe('EmptyBagToast', () => {
  it('위시리스트가 비었을 때 엑스 아이콘과 안내 문구를 보여 준다', () => {
    render(<EmptyBagToast bag="wishlist" />)

    expect(screen.getByText('위시리스트에 담긴 상품이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('눌러서 상품을 담으러 가기')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeTruthy()
  })

  it('쇼핑백이 비었을 때 쇼핑백 안내 문구를 보여 준다', () => {
    render(<EmptyBagToast bag="cart" />)

    expect(screen.getByText('쇼핑백에 담긴 상품이 없습니다')).toBeInTheDocument()
  })

  it('onGoProducts가 있으면 토스트 전체가 눌리는 버튼이 된다', () => {
    const onGoProducts = vi.fn()
    render(<EmptyBagToast bag="wishlist" onGoProducts={onGoProducts} />)

    fireEvent.click(screen.getByRole('button', { name: '상품 목록 보러가기' }))
    expect(onGoProducts).toHaveBeenCalled()
  })
})
