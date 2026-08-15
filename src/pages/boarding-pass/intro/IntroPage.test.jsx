import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import AppProviders from '@/app/providers.jsx'

import { Component } from './IntroPage.jsx'
import styles from './IntroPage.module.scss'

function renderIntro(initialEntries = ['/boarding-pass/survey', '/boarding-pass/intro']) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Home</p> },
      { path: '/boarding-pass', element: <p>Landing</p> },
      { path: '/boarding-pass/intro', element: <Component /> },
      { path: '/boarding-pass/survey', element: <p>Survey</p> },
    ],
    { initialEntries },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('IntroPage', () => {
  it('보딩패스 영역을 화면 높이까지 채운다', () => {
    renderIntro(['/boarding-pass/intro'])

    expect(screen.getByRole('main')).toHaveClass(styles.page)
  })

  it('패스 카드 카피를 DOM 텍스트로 렌더한다', () => {
    renderIntro(['/boarding-pass/intro'])

    expect(screen.getByText('Check-in')).toBeInTheDocument()
    expect(screen.getByText('BOARDING PASS')).toBeInTheDocument()
    expect(screen.getByText('당신의 MCM HAUS 비행을 위한')).toBeInTheDocument()
  })

  it('닫기는 이전 설문이 아니라 보딩패스 랜딩으로 이동한다', () => {
    const router = renderIntro()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('닫기는 intro history를 교체해서 뒤로 가도 intro가 다시 열리지 않는다', async () => {
    const router = renderIntro(['/', '/boarding-pass', '/boarding-pass/intro'])

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(router.state.location.pathname).toBe('/boarding-pass')

    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/boarding-pass')
    expect(router.state.location.pathname).not.toBe('/boarding-pass/intro')
  })
})
