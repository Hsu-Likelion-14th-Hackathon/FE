import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(progressbar).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('AI Fitting 준비가 완료되었습니다.')).toBeInTheDocument()
  })
})
