import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signup = vi.hoisted(() => vi.fn())
const createProfile = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/authApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  signup: (...args) => signup(...args),
  createProfile: (...args) => createProfile(...args),
}))

import { Component as SignupPage } from './SignupPage.jsx'

/**
 * 추가 정보 단계까지 진행한다.
 *
 * 가입은 이메일·비밀번호로 계정을 만든 뒤 여권 정보를 받는 두 단계다. 여권
 * 정보 화면을 보려면 첫 단계를 통과해야 한다.
 */
async function renderProfileStep() {
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByLabelText(/이메일 주소/), { target: { value: 'a@b.c' } })
  fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'password' } })
  fireEvent.click(screen.getByRole('button', { name: '다음' }))

  await screen.findByRole('button', { name: '가입하기' })
}

function getSignupFormData() {
  const submitButton = screen.getByRole('button', { name: '가입하기' })

  return new FormData(submitButton.closest('form'))
}

beforeEach(() => {
  signup.mockReset()
  signup.mockResolvedValue({ accessToken: 'issued', userId: 1 })
  createProfile.mockReset()
  createProfile.mockResolvedValue({ userId: 1 })
})

describe('SignupPage', () => {
  it('국기를 포함한 현지어·영문 국가명을 검색하고 ISO alpha-2 국적을 보낸다', async () => {
    await renderProfileStep()

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
    // 백엔드는 ISO 3166-1 alpha-2를 받는다(추가 정보 입력 명세의 `예: KR`).
    expect(getSignupFormData().get('nationality')).toBe('KR')
  })

  it('RTL 현지어 국가도 검색하고 ISO alpha-2 국적을 보낸다', async () => {
    await renderProfileStep()

    fireEvent.click(screen.getByRole('button', { name: /국적/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: 'Bahrain' },
    })

    const bahrainOption = screen.getByRole('option', { name: 'البحرين (Bahrain)' })

    expect(bahrainOption).toHaveTextContent('البحرين (Bahrain)')

    fireEvent.click(bahrainOption)

    expect(screen.getByRole('button', { name: /국적/ })).toHaveTextContent('البحرين (Bahrain)')
    expect(getSignupFormData().get('nationality')).toBe('BH')
  })

  it('RTL 현지어 국가명도 목록의 왼쪽 기준선에 맞춘다', async () => {
    await renderProfileStep()

    fireEvent.click(screen.getByRole('button', { name: /국적/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: 'Bahrain' },
    })

    const bahrainOption = screen.getByRole('option', { name: /Bahrain/ })
    const nativeName = within(bahrainOption).getByText('البحرين')

    expect(nativeName).toHaveAttribute('dir', 'auto')
    expect(window.getComputedStyle(nativeName).textAlign).toBe('left')
  })

  it('달력에서 윤년 생년월일을 선택하고 YYYY-MM-DD 값으로 보관한다', async () => {
    await renderProfileStep()

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

  it('생년월일 달력과 국적 목록을 동시에 열지 않는다', async () => {
    await renderProfileStep()

    fireEvent.click(screen.getByRole('button', { name: /생년월일/ }))
    expect(screen.getByRole('dialog', { name: '생년월일 선택' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /국적/ }))

    expect(screen.queryByRole('dialog', { name: '생년월일 선택' })).not.toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: '국적 선택' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('listbox', { name: '국적 선택' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /국적/ })).toHaveFocus()
  })

  it('이메일과 비밀번호로 계정을 만든 뒤 여권 정보를 받는다', async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    // 첫 화면에는 여권 정보 칸이 없다. 계정부터 만든다.
    expect(screen.queryByLabelText(/이름/)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/이메일 주소/), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith({ email: 'a@b.c', password: 'password' }),
    )
    expect(await screen.findByLabelText(/이름/)).toBeInTheDocument()
  })

  it('이미 다른 방식으로 가입된 이메일이면 백엔드 안내를 그대로 남긴다', async () => {
    // 카카오로 가입된 이메일이라 일반 가입이 막힌다. 메시지에 어느 쪽으로
    // 가야 하는지가 담겨 오므로 우리가 문구를 새로 짓지 않는다.
    signup.mockRejectedValue(
      Object.assign(
        new Error('이미 다른 방식으로 가입된 이메일입니다. 카카오 로그인을 이용해주세요'),
        {
          name: 'ApiError',
          status: 409,
          code: 'EMAIL_ALREADY_REGISTERED',
        },
      ),
    )

    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/이메일 주소/), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('카카오 로그인을 이용해주세요')
    // 토스트로 띄우면 사라져서 안내를 다시 볼 수 없다. 화면에 남기고 갈 곳도 준다.
    expect(within(alert).getByRole('link', { name: '로그인 화면으로 이동' })).toHaveAttribute(
      'href',
      '/login',
    )
    // 계정이 만들어지지 않았으므로 다음 단계로 넘어가지 않는다.
    expect(screen.queryByLabelText(/이름/)).not.toBeInTheDocument()
  })

  it('여권 정보를 alpha-2 국적으로 제출한다', async () => {
    await renderProfileStep()

    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: 'yeonju lim' } })
    fireEvent.click(screen.getByRole('button', { name: /국적/ }))
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: '대한민국' },
    })
    fireEvent.click(screen.getByRole('option', { name: '대한민국 (Republic of Korea)' }))
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form'))

    await waitFor(() =>
      expect(createProfile).toHaveBeenCalledWith({
        name: 'YEONJU LIM',
        birthDate: '',
        nationality: 'KR',
      }),
    )
  })
})
