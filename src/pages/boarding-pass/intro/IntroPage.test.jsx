import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import AppProviders from '@/app/providers.jsx'

import { Component } from './IntroPage.jsx'
import styles from './IntroPage.module.scss'

describe('IntroPage', () => {
  it('보딩패스 영역을 화면 높이까지 채운다', () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <Component />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(screen.getByRole('main')).toHaveClass(styles.page)
  })
})
