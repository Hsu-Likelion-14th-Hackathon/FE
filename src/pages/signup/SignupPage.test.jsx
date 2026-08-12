import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Component as SignupPage } from './SignupPage.jsx'

function renderSignupPage() {
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  )
}

function getSignupFormData() {
  const submitButton = screen.getByRole('button', { name: '가입하기' })

  return new FormData(submitButton.closest('form'))
}

describe('SignupPage', () => {
  it('국기를 포함한 현지어·영문 국가명을 검색하고 API용 영문 국적을 선택한다', () => {
    renderSignupPage()

    const countryButton = screen.getByRole('button', { name: /국적/ })

    expect(countryButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(countryButton)
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: '대한민국' },
    })

    const countryList = screen.getByRole('listbox', { name: '국적 선택' })
    const koreaOption = within(countryList).getByRole('option', {
      name: '대한민국 (Republic of Korea)',
    })

    fireEvent.click(koreaOption)

    expect(countryButton).toHaveAttribute('aria-expanded', 'false')
    expect(countryButton).toHaveTextContent('대한민국 (Republic of Korea)')
    expect(screen.getByRole('img', { name: 'Republic of Korea 국기' })).toBeInTheDocument()
    expect(getSignupFormData().get('nationality')).toBe('Republic of Korea')
  })

  it('RTL 현지어 국가도 검색하고 API용 영문 국적을 선택한다', () => {
    renderSignupPage()

    fireEvent.click(screen.getByRole('button', { name: /국적/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: 'Bahrain' },
    })

    const bahrainOption = screen.getByRole('option', { name: 'البحرين (Bahrain)' })

    expect(bahrainOption).toHaveTextContent('البحرين (Bahrain)')

    fireEvent.click(bahrainOption)

    expect(screen.getByRole('button', { name: /국적/ })).toHaveTextContent('البحرين (Bahrain)')
    expect(getSignupFormData().get('nationality')).toBe('Kingdom of Bahrain')
  })

  it('RTL 현지어 국가명도 목록의 왼쪽 기준선에 맞춘다', () => {
    renderSignupPage()

    fireEvent.click(screen.getByRole('button', { name: /국적/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: 'Bahrain' },
    })

    const bahrainOption = screen.getByRole('option', { name: /Bahrain/ })
    const nativeName = within(bahrainOption).getByText('البحرين')

    expect(nativeName).toHaveAttribute('dir', 'auto')
    expect(window.getComputedStyle(nativeName).textAlign).toBe('left')
  })

  it('달력에서 윤년 생년월일을 선택하고 YYYY-MM-DD 값으로 보관한다', () => {
    renderSignupPage()

    const birthDateButton = screen.getByRole('button', { name: /생년월일/ })

    fireEvent.click(birthDateButton)

    expect(screen.getByRole('dialog', { name: '생년월일 선택' })).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: '연도' }), {
      target: { value: '2000' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: '월' }), {
      target: { value: '2' },
    })
    fireEvent.click(screen.getByRole('button', { name: '2000년 2월 29일' }))

    expect(screen.queryByRole('dialog', { name: '생년월일 선택' })).not.toBeInTheDocument()
    expect(birthDateButton).toHaveFocus()
    expect(birthDateButton).toHaveTextContent('2000. 02. 29.')
    expect(getSignupFormData().get('birthDate')).toBe('2000-02-29')
  })

  it('생년월일 달력과 국적 목록을 동시에 열지 않는다', () => {
    renderSignupPage()

    fireEvent.click(screen.getByRole('button', { name: /생년월일/ }))
    expect(screen.getByRole('dialog', { name: '생년월일 선택' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /국적/ }))

    expect(screen.queryByRole('dialog', { name: '생년월일 선택' })).not.toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: '국적 선택' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('listbox', { name: '국적 선택' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /국적/ })).toHaveFocus()
  })
})
