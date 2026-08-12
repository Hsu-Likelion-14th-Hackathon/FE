import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import BoardingPassChrome from './BoardingPassChrome.jsx'

describe('BoardingPassChrome', () => {
  it('메뉴·로고·위시리스트·장바구니의 조작 영역을 2.75rem으로 유지한다', () => {
    render(
      <MemoryRouter>
        <BoardingPassChrome />
      </MemoryRouter>,
    )

    const menu = screen.getByRole('button', { name: '메뉴 열기' })
    const row = menu.parentElement.parentElement
    const left = menu.parentElement
    const right = screen.getByRole('link', { name: '위시리스트' }).parentElement

    expect(window.getComputedStyle(row).display).toBe('flex')
    expect(window.getComputedStyle(row).height).toBe('3.375rem')
    expect(window.getComputedStyle(left).display).toBe('flex')
    expect(window.getComputedStyle(right).display).toBe('flex')
    for (const control of [
      menu,
      screen.getByRole('link', { name: 'MCM 메인' }),
      screen.getByRole('link', { name: '위시리스트' }),
      screen.getByRole('link', { name: '장바구니' }),
    ]) {
      expect(window.getComputedStyle(control).width).toBe('2.75rem')
      expect(window.getComputedStyle(control).height).toBe('2.75rem')
    }
  })
})
