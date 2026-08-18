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

  it('이메일에 친 공백은 걷어내고 이유를 알린다', () => {
    // 이메일에 공백은 어차피 유효하지 않다. 특히 모바일 자동완성의 꼬리
    // 공백은 눈에 안 보여, 조용히 지우면 지운 적 없는 글자가 사라진 것처럼
    // 보인다.
    renderLogin()

    const email = screen.getByLabelText(/이메일 주소/)
    fireEvent.change(email, { target: { value: ' a@b .c ' } })

    expect(email.value).toBe('a@b.c')
    expect(screen.getByText('이메일에는 공백을 입력할 수 없습니다')).toBeInTheDocument()

    // 공백 없이 다시 치면 안내도 사라진다. 같은 값이면 React가 change를
    // 생략하므로 다른 값으로 잇는다.
    fireEvent.change(email, { target: { value: 'a@b.cd' } })
    expect(screen.queryByText('이메일에는 공백을 입력할 수 없습니다')).not.toBeInTheDocument()
  })

  it('비밀번호에 친 공백도 걷어내고 이유를 알린다', () => {
    // 가입이 공백을 막으므로 공백이 든 비밀번호는 있을 수 없다. 가려진
    // 칸에서 별표만 늘면 오타와 구분되지 않는다.
    renderLogin()

    const password = screen.getByLabelText(/^비밀번호/)
    fireEvent.change(password, { target: { value: 'Pass w0rd! ' } })

    expect(password.value).toBe('Passw0rd!')
    expect(screen.getByText('비밀번호에는 공백을 입력할 수 없습니다')).toBeInTheDocument()

    // 공백 없이 다시 치면 안내도 사라진다. 같은 값이면 React가 change를
    // 생략하므로 다른 값으로 잇는다.
    fireEvent.change(password, { target: { value: 'Passw0rd!!' } })
    expect(screen.queryByText('비밀번호에는 공백을 입력할 수 없습니다')).not.toBeInTheDocument()
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
