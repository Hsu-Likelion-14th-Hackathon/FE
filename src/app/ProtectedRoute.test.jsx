import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { clearAccessToken, setAccessToken } from '@/shared/api/authToken.js'
import { setProfilePending } from '@/shared/api/profilePending.js'

import { ProtectedRoute } from './ProtectedRoute.jsx'
import { createAppRoutes } from './router.jsx'

/** 로그인 화면 대역 — 어디서 왔는지(state.from)를 그대로 보여 준다. */
function LoginProbe() {
  const location = useLocation()
  return <p>로그인 화면 (from: {location.state?.from ?? '없음'})</p>
}

/** 가입 화면 대역 — 어느 단계로, 어디서 왔는지 보여 준다. */
function SignupProbe() {
  const location = useLocation()
  return (
    <p>
      가입 화면 (step: {location.state?.step ?? '없음'}, from: {location.state?.from ?? '없음'})
    </p>
  )
}

function renderGuarded(initialEntry) {
  const router = createMemoryRouter(
    [
      { path: '/login', Component: LoginProbe },
      { path: '/signup', Component: SignupProbe },
      {
        Component: ProtectedRoute,
        children: [{ path: '/secret', element: <p>비밀 화면</p> }],
      },
    ],
    { initialEntries: [initialEntry] },
  )

  render(<RouterProvider router={router} />)
  return router
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    clearAccessToken()
    setProfilePending(false)
  })

  it('토큰이 없으면 로그인으로 보내고 돌아올 곳을 남긴다', async () => {
    renderGuarded('/secret?tab=1')

    expect(await screen.findByText('로그인 화면 (from: /secret?tab=1)')).toBeInTheDocument()
    expect(screen.queryByText('비밀 화면')).not.toBeInTheDocument()
  })

  it('토큰이 있으면 화면을 그대로 연다', async () => {
    setAccessToken('live-token')
    renderGuarded('/secret')

    expect(await screen.findByText('비밀 화면')).toBeInTheDocument()
  })

  it('프로필이 미완성이면 가입 2단계로 보내고 돌아올 곳을 남긴다', async () => {
    // 가입 1단계·카카오 신규는 토큰부터 준다. 프로필 화면에서 이탈한 사용자를
    // 여기서 잡지 않으면 보호 구간의 화면마다 API가 제각각 실패한다.
    setAccessToken('signup-token')
    setProfilePending(true)
    renderGuarded('/secret?tab=1')

    expect(
      await screen.findByText('가입 화면 (step: profile, from: /secret?tab=1)'),
    ).toBeInTheDocument()
    expect(screen.queryByText('비밀 화면')).not.toBeInTheDocument()
  })

  it('프로필을 완성하고 돌아오면 같은 주소가 열린다', async () => {
    setAccessToken('signup-token')
    setProfilePending(true)
    const router = renderGuarded('/secret')
    expect(await screen.findByText(/가입 화면/)).toBeInTheDocument()

    // createProfile 성공 → SignupPage가 state.from으로 돌려보내는 흐름과 같다.
    setProfilePending(false)
    await act(() => router.navigate('/secret'))

    expect(await screen.findByText('비밀 화면')).toBeInTheDocument()
  })

  it('401로 토큰이 지워지면 그 즉시 로그인으로 돌려보낸다', async () => {
    setAccessToken('stale-token')
    renderGuarded('/secret')
    expect(await screen.findByText('비밀 화면')).toBeInTheDocument()

    // apiFetch가 401에서 하는 일과 같다 — 구독이 가드를 다시 깨운다.
    act(() => clearAccessToken())

    expect(await screen.findByText('로그인 화면 (from: /secret)')).toBeInTheDocument()
  })

  it('백엔드 데이터를 그리는 라우트는 전부 보호 구간에 있다', () => {
    const [root] = createAppRoutes()
    const guarded = root.children.find((route) => route.Component === ProtectedRoute)
    const guardedPaths = guarded.children.map((route) => route.path)

    expect(guardedPaths).toEqual([
      // 인트로는 데이터가 없지만 여정의 입구라 함께 잠근다 — 공개로 두면
      // 인트로를 보다가 Next(설문)에서 끊긴다.
      'boarding-pass/intro',
      'products',
      'products/:productId',
      'products/:productId/try-on',
      'wishlist',
      'cart',
      'boarding-pass/passport',
      'boarding-pass/survey',
      'boarding-pass/complete',
      'boarding-pass/scan',
      'boarding-pass/flight',
      'boarding-pass/guide',
    ])

    // 정적 무대는 공개로 남는다 — 로그인 없이 행사 소개까지는 볼 수 있어야 한다.
    const openPaths = root.children.filter((route) => route.path).map((route) => route.path)
    expect(openPaths).toContain('boarding-pass')
    expect(openPaths).not.toContain('boarding-pass/intro')
    expect(openPaths).toContain('login')
  })
})
