import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import BoardingPassChrome from './BoardingPassChrome.jsx'

describe('BoardingPassChrome', () => {
  it('아이콘 행을 한 줄 flex 레이아웃으로 유지한다', () => {
    render(<BoardingPassChrome />)

    const row = screen.getByRole('button', { name: '메뉴' }).parentElement.parentElement
    const left = screen.getByRole('button', { name: '메뉴' }).parentElement
    const right = screen.getByRole('button', { name: '위시리스트' }).parentElement

    expect(window.getComputedStyle(row).display).toBe('flex')
    expect(window.getComputedStyle(row).height).toBe('3.375rem')
    expect(window.getComputedStyle(left).display).toBe('flex')
    expect(window.getComputedStyle(right).display).toBe('flex')
    expect(window.getComputedStyle(screen.getByRole('button', { name: '메뉴' })).width).toBe(
      '2.75rem',
    )
    expect(window.getComputedStyle(screen.getByRole('button', { name: '메뉴' })).height).toBe(
      '2.75rem',
    )
  })
})
