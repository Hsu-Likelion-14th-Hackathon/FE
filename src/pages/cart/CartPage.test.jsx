import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getShoppingBag = vi.hoisted(() => vi.fn())
const removeFromShoppingBag = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/shoppingBagApi.js', () => ({
  getShoppingBag: (...args) => getShoppingBag(...args),
  removeFromShoppingBag: (...args) => removeFromShoppingBag(...args),
}))

import { Component } from './CartPage.jsx'

/** GET /shopping-bag 계약(ShoppingBagItemResponse) 모양 그대로 둔다. */
const serverItems = [
  {
    shoppingBagItemId: 5,
    productSizeId: 1,
    productId: 1,
    name: 'Pina 비세토스 탬버린 백',
    price: 1690000,
    thumbnailImageUrl: 'https://cdn/pina.jpg',
    colorName: 'COGNAC',
    sizeLabel: 'S',
    sizeNote: null,
    sku: 'MWRGAOB01CO001',
    quantity: 1,
  },
  {
    shoppingBagItemId: 8,
    productSizeId: 9,
    productId: 4,
    name: '모노그램 프린트 러버 슬라이드',
    price: 350000,
    thumbnailImageUrl: null,
    colorName: 'SOFT PINK',
    sizeLabel: '36 IT',
    sizeNote: '여성',
    sku: 'MESGSMM04PZ036',
    quantity: 1,
  },
]

function renderCart() {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
}

async function renderLoadedCart() {
  renderCart()
  await screen.findByText('쇼핑백에 2개의 품목이 있습니다')
}

beforeEach(() => {
  getShoppingBag.mockReset().mockResolvedValue([...serverItems])
  removeFromShoppingBag.mockReset().mockResolvedValue(true)
})

describe('CartPage', () => {
  it('서버 항목을 이름·₩ 가격·색·사이즈·SKU로 그린다', async () => {
    await renderLoadedCart()

    expect(screen.getByText('나의 쇼핑백 (2개 품목)')).toBeInTheDocument()
    expect(screen.getByText('Pina 비세토스 탬버린 백')).toBeInTheDocument()
    expect(screen.getByText('₩1,690,000')).toBeInTheDocument()
    expect(screen.getByText('COGNAC')).toBeInTheDocument()
    // sizeNote가 있으면 `라벨 / 비고`, 없으면 라벨만.
    expect(screen.getByText('36 IT / 여성')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    // SKU 표기는 디자인의 `#` 접두어를 화면에서 붙인다. 백엔드 값에는 없다.
    expect(screen.getByText('#MWRGAOB01CO001')).toBeInTheDocument()
  })

  it('상품 선택을 토글하고 모두 삭제하면 빈 쇼핑백 상태로 전환한다', async () => {
    await renderLoadedCart()

    const firstSelection = screen.getByRole('button', { name: 'Pina 비세토스 탬버린 백 선택' })
    const secondSelection = screen.getByRole('button', {
      name: '모노그램 프린트 러버 슬라이드 선택',
    })

    expect(firstSelection).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(secondSelection)
    expect(secondSelection).toHaveAttribute('aria-pressed', 'true')

    for (let index = 0; index < 2; index += 1) {
      fireEvent.click(screen.getAllByRole('button', { name: /쇼핑백에서 삭제/ })[0])
    }

    expect(screen.getByText('나의 쇼핑백 (0개 품목)')).toBeInTheDocument()
    expect(screen.getByText('쇼핑백이 비어 있습니다')).toBeInTheDocument()
  })

  it('삭제는 shoppingBagItemId로 요청한다', async () => {
    // id가 셋(productColorId·productSizeId·shoppingBagItemId)이라 섞이면
    // 조용히 다른 항목이 지워진다. 어느 id가 실리는지 여기서 고정한다.
    await renderLoadedCart()

    fireEvent.click(screen.getByRole('button', { name: 'Pina 비세토스 탬버린 백 쇼핑백에서 삭제' }))

    expect(removeFromShoppingBag).toHaveBeenCalledWith(5)
  })

  it('삭제가 실패하면 항목을 제자리에 되돌린다', async () => {
    removeFromShoppingBag.mockRejectedValue(new Error('네트워크 오류'))
    await renderLoadedCart()

    fireEvent.click(screen.getByRole('button', { name: 'Pina 비세토스 탬버린 백 쇼핑백에서 삭제' }))
    expect(screen.queryByText('Pina 비세토스 탬버린 백')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Pina 비세토스 탬버린 백')).toBeInTheDocument())
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Pina 비세토스 탬버린 백')
  })

  it('결제하기 버튼은 담긴 상품이 있어도 보이지 않는다', async () => {
    // 결제는 이번 범위가 아니라 화면에서 뺐다. 상품이 있는 상태에서 확인해야
    // 의미가 있다. 비어 있을 때만 보면 늘 통과하는 검사가 된다.
    await renderLoadedCart()

    expect(screen.queryByRole('button', { name: '결제하기' })).not.toBeInTheDocument()
  })

  it('로그인이 없어 401이 오면 로그인 링크를 보여 준다', async () => {
    getShoppingBag.mockRejectedValue(
      Object.assign(new Error('인증이 필요합니다.'), { status: 401 }),
    )
    renderCart()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '쇼핑백을 보려면 로그인이 필요합니다.',
    )
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/login')
  })
})
