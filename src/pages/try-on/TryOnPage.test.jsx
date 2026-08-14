import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getProduct, getProductVariant } from '@/shared/data/products.js'
import { Component } from './TryOnPage.jsx'

function renderTryOn() {
  render(
    <MemoryRouter initialEntries={['/products/mcm-001/try-on']}>
      <Routes>
        <Route path="/products/:productId/try-on" element={<Component />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TryOnPage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('업로드 상태를 Figma 문구와 함께 표시한다', () => {
    renderTryOn()

    expect(screen.getByRole('heading', { name: '상품 착용' })).toBeInTheDocument()
    expect(screen.queryByText(/상품 ID:/)).not.toBeInTheDocument()
    expect(screen.getByText('Credit | 100')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fitting' })).toBeInTheDocument()
  })

  it('Fitting을 시작하면 진행률이 0에서 100까지 증가한다', async () => {
    vi.useFakeTimers()
    renderTryOn()

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))

    const progressbar = screen.getByRole('progressbar', { name: 'AI Fitting 진행률' })
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1040)
    })
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeLessThan(100)

    // 100%에 닿는 순간 결과 화면으로 바뀌어 진행률 바가 사라진다.
    // 그 전환 자체는 아래 검사가 맡는다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1040)
    })
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeGreaterThan(20)
  })

  it('진행률이 100%에 닿으면 결과 화면으로 넘어간다', () => {
    // 이 검사가 없어 결과 화면이 아예 나올 수 없는 상태를 놓쳤다.
    // phase는 loading에 머무르고 화면만 진행률에서 파생된다.
    vi.useFakeTimers()
    renderTryOn()

    fireEvent.click(screen.getByRole('button', { name: /Fitting/ }))
    expect(screen.getByRole('progressbar', { name: 'AI Fitting 진행률' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(80 * 25)
    })

    expect(screen.getByRole('region', { name: 'AI Fitting 결과' })).toBeInTheDocument()
    expect(screen.getByText('지금, 당신에게 맞는 형태')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이미지 저장' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('결과 카드는 주소의 상품을 보여준다', () => {
    // 어떤 상품에서 들어와도 같은 상품을 보여주고 있었다.
    vi.useFakeTimers()
    render(
      <MemoryRouter initialEntries={['/products/mcm-002/try-on']}>
        <Routes>
          <Route path="/products/:productId/try-on" element={<Component />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Fitting/ }))
    act(() => {
      vi.advanceTimersByTime(80 * 25)
    })

    // 이전 상품명이 없는지만 보면 가격과 그림이 틀린 것을 놓친다.
    const result = screen.getByRole('region', { name: 'AI Fitting 결과' })
    const product = getProduct('mcm-002')
    expect(result).toHaveTextContent(product.name)
    expect(result).toHaveTextContent(product.priceLabel)
    // 첫 img는 닫기 아이콘이라 상품 썸네일을 집어야 한다.
    expect(result.querySelector('[class*=productThumb] img')).toHaveAttribute(
      'src',
      getProductVariant(product, product.cardVariantId).image,
    )
  })

  it('처리 중 화면에서도 모노그램이 어둠막 위에 남는다', () => {
    render(
      <MemoryRouter initialEntries={['/products/mcm-002/try-on']}>
        <Routes>
          <Route path="/products/:productId/try-on" element={<Component />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Fitting/ }))

    const stage = screen.getByRole('region', { name: 'AI Fitting 처리 중' })
    const monogram = stage.querySelector('[class*=monogram]')
    // 어둠막(::before)과 같은 층에 있어야 트리 순서로 그 위에 얹힌다. 0으로
    // 내려가면 60% 어둠막 아래로 깔려 로딩 화면에서 무늬가 사라진다.
    expect(window.getComputedStyle(monogram).zIndex).toBe('1')
    // 무늬는 어둠막보다 뒤에 와야 한다. 앞에 두면 다시 묻힌다.
    expect(monogram).toBe(stage.firstElementChild)
  })
})
