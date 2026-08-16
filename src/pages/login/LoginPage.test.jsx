import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Component } from './LoginPage.jsx'

function renderLogin() {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('제출을 막아 비밀번호가 주소창에 남지 않게 한다', () => {
    // 핸들러가 없으면 브라우저가 기본 동작으로 GET 제출을 한다. 그러면 페이지가
    // 새로고침되고 email과 password가 쿼리스트링에 평문으로 붙어 방문 기록에 남는다.
    renderLogin()

    const form = screen.getByLabelText(/이메일 주소/).closest('form')
    const submitted = fireEvent.submit(form)

    // fireEvent는 preventDefault가 불렸으면 false를 돌려준다.
    expect(submitted).toBe(false)
  })

  it('비밀번호를 가렸다 보였다 할 수 있다', () => {
    renderLogin()

    const password = screen.getByLabelText(/비밀번호/)
    const toggle = screen.getByRole('button', { name: '표시' })
    expect(password).toHaveAttribute('type', 'password')

    fireEvent.click(toggle)
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: '숨김' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('입력을 테두리 있는 상자로 두고 헤더 아래에 구분선을 긋는다', () => {
    renderLogin()

    // Figma 93:81 — 밑줄만 있던 28px 입력이 모서리 둥근 50px 상자로 바뀌었다.
    // jsdom은 var()가 든 border 단축 속성을 전개하지 못해 색은 여기서 못 본다.
    const email = window.getComputedStyle(screen.getByLabelText(/이메일 주소/))
    expect(email.height).toBe('50px')
    expect(email.borderRadius).toBe('8px')

    // 구분선은 로그인·카카오 버튼 사이가 아니라 헤더 바로 아래에 있다.
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('카카오 버튼 문구를 디자인대로 쓴다', () => {
    renderLogin()

    expect(screen.getByRole('button', { name: '카카오로 로그인' })).toBeInTheDocument()
  })

  it('회원가입 링크가 보호 라우트가 남긴 자리를 이어 준다', async () => {
    // 위시리스트에서 튕겨 온 사람이 이메일로 가입해도, 가입 완료 뒤 원래
    // 가려던 곳으로 돌아가야 한다.
    const router = createMemoryRouter(
      [
        { path: '/login', Component },
        { path: '/signup', element: <h1>가입</h1> },
      ],
      { initialEntries: [{ pathname: '/login', state: { from: '/wishlist' } }] },
    )
    render(<RouterProvider router={router} />)

    fireEvent.click(screen.getByRole('link', { name: '회원가입' }))

    expect(router.state.location.pathname).toBe('/signup')
    expect(router.state.location.state).toEqual({ from: '/wishlist' })
  })
})
