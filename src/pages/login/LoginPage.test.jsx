import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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
})
