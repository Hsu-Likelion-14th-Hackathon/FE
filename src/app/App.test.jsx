import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App.jsx'

describe('App', () => {
  it('초기 설정 완료 화면을 렌더링한다', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'MCM BOARDING PASS' })).toBeInTheDocument()
  })
})
