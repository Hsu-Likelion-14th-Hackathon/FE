import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loginWithKakao = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/authApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  loginWithKakao: (...args) => loginWithKakao(...args),
}))

import { Component as KakaoCallbackPage } from './KakaoCallbackPage.jsx'

function renderCallback(search) {
  const router = createMemoryRouter(
    [
      { path: '/auth/kakao/callback', Component: KakaoCallbackPage },
      { path: '/', element: <h1>메인</h1> },
      { path: '/signup', element: <h1>추가 정보</h1> },
      { path: '/login', element: <h1>로그인</h1> },
    ],
    { initialEntries: [`/auth/kakao/callback${search}`] },
  )

  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  loginWithKakao.mockReset()
  sessionStorage.clear()
})

describe('KakaoCallbackPage', () => {
  it('주소의 code를 redirectUri와 함께 넘긴다', async () => {
    loginWithKakao.mockResolvedValue({ accessToken: 'issued', isNewUser: false })

    const router = renderCallback('?code=auth-code')

    await waitFor(() => expect(loginWithKakao).toHaveBeenCalledOnce())
    // 카카오는 토큰 교환 때 authorize에 쓴 주소와 같은 값을 요구한다.
    expect(loginWithKakao).toHaveBeenCalledWith({
      code: 'auth-code',
      redirectUri: `${window.location.origin}/auth/kakao/callback`,
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('신규 가입이면 추가 정보 화면으로 보낸다', async () => {
    // 카카오는 인증만 맡아 이름·생년월일·국적을 주지 않는다.
    loginWithKakao.mockResolvedValue({ accessToken: 'issued', isNewUser: true })

    const router = renderCallback('?code=auth-code')

    await waitFor(() => expect(router.state.location.pathname).toBe('/signup'))
    expect(router.state.location.state).toEqual({ step: 'profile' })
  })

  it('돌아갈 곳을 기억해 두었으면 그리로 보낸다', async () => {
    sessionStorage.setItem('mcm-kakao-return-to', '/products')
    loginWithKakao.mockResolvedValue({ accessToken: 'issued', isNewUser: false })

    const router = renderCallback('?code=auth-code')

    await waitFor(() => expect(router.state.location.pathname).toBe('/products'))
  })

  it('code가 없거나 카카오가 오류를 주면 부르지 않고 사유를 보여 준다', async () => {
    renderCallback('?error=access_denied&error_description=사용자가 취소했습니다')

    expect(await screen.findByRole('alert')).toHaveTextContent('사용자가 취소했습니다')
    expect(loginWithKakao).not.toHaveBeenCalled()
  })

  it('교환에 실패하면 백엔드 message를 그대로 보여 준다', async () => {
    loginWithKakao.mockRejectedValue(
      Object.assign(new Error('이미 다른 방식으로 가입된 이메일입니다'), {
        name: 'ApiError',
        code: 'EMAIL_ALREADY_REGISTERED',
      }),
    )

    renderCallback('?code=auth-code')

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 다른 방식으로 가입된')
    expect(screen.getByRole('button', { name: '로그인 화면으로' })).toBeInTheDocument()
  })
})
