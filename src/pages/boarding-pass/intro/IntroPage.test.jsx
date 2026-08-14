import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import AppProviders from '@/app/providers.jsx'

import { Component } from './IntroPage.jsx'
import styles from './IntroPage.module.scss'

function renderIntro(initialEntries = ['/boarding-pass/survey', '/boarding-pass/intro']) {
  const router = createMemoryRouter(
    [
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

  it('닫기는 이전 설문이 아니라 보딩패스 랜딩으로 이동한다', () => {
    const router = renderIntro()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(router.state.location.pathname).toBe('/boarding-pass')
  })
})
