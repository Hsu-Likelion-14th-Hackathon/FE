import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Component } from './LoginPage.jsx'

const backend = vi.hoisted(() => ({ offline: false }))

vi.mock('@/shared/api/useBackendOffline.js', () => ({
  default: () => backend.offline,
}))

const login = vi.hoisted(() => vi.fn(() => Promise.resolve({ accessToken: 't' })))

vi.mock('@/shared/api/authApi.js', () => ({ login }))

function renderLogin() {
  render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  login.mockClear()
})

describe('LoginPage 데모 모드', () => {
  it('백엔드가 꺼져 있으면 데모 안내를 띄우고 입력 없이 데모 계정으로 들어간다', async () => {
    backend.offline = true
    renderLogin()

    expect(screen.getByText('체험용 데모 모드')).toBeInTheDocument()
    expect(screen.getByText('로그인 버튼만 누르면 데모 계정으로 바로 들어가요')).toBeInTheDocument()
    // 비어 있어도 브라우저 필수 검사에 막히지 않아야 한다.
    expect(screen.getByLabelText(/이메일 주소/)).not.toBeRequired()

    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'guest@mcm.demo', password: 'demo' }),
    )
  })

  it('백엔드가 살아 있으면 안내가 없고 입력한 값으로 로그인한다', async () => {
    backend.offline = false
    renderLogin()

    expect(screen.queryByText('체험용 데모 모드')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/이메일 주소/)).toBeRequired()

    fireEvent.change(screen.getByLabelText(/이메일 주소/), { target: { value: 'a@b.cd' } })
    fireEvent.change(screen.getByLabelText(/^비밀번호/), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'a@b.cd', password: 'Passw0rd!' }),
    )
  })
})
