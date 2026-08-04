import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Component as SignupPage } from './SignupPage.jsx'

describe('SignupPage', () => {
  it('국적 목록을 열고 대한민국을 선택한다', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    const countryButton = screen.getByRole('button', { name: /국적/ })

    expect(countryButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox', { name: '국적 선택' })).not.toBeInTheDocument()

    fireEvent.click(countryButton)

    expect(countryButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox', { name: '국적 선택' })).toBeInTheDocument()
    expect(countryButton).toHaveTextContent('대한민국 (Republic of Korea)')

    fireEvent.click(
      screen.getByRole('option', {
        name: '대한민국 (Republic of Korea)',
      }),
    )

    expect(countryButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox', { name: '국적 선택' })).not.toBeInTheDocument()
    expect(countryButton).toHaveTextContent('대한민국 (Republic of Korea)')
  })
})
