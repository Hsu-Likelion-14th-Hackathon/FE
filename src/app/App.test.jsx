import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App.jsx'

describe('App', () => {
  it('루트 진입 시 보딩패스 인트로 라우트를 렌더링한다', async () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(
      await screen.findByRole('button', { name: /Next/i }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })
})
