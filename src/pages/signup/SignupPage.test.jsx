import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signup = vi.hoisted(() => vi.fn())
const createProfile = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/authApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  signup: (...args) => signup(...args),
  createProfile: (...args) => createProfile(...args),
}))

import { setProfilePending } from '@/shared/api/profilePending.js'

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
  // 규칙을 만족하는 값이어야 다음 단계로 넘어간다.
  fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'Passw0rd!' } })
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
  setProfilePending(false)
})

// 국가 목록 249개를 그리고 단계까지 넘어간다. 다른 파일과 함께 돌면 기본
// 5초로는 모자라 간헐적으로 시간이 초과된다.
describe('SignupPage', { timeout: 15_000 }, () => {
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
    // 규칙을 만족하는 값이어야 다음 단계로 넘어간다.
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith({ email: 'a@b.c', password: 'Passw0rd!' }),
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
    // 규칙을 만족하는 값이어야 다음 단계로 넘어간다.
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    // 이메일 문제라 이메일 칸 옆에 붙는다. 다른 칸에 두면 어디를 고쳐야
    // 하는지 눈으로도 스크린리더로도 알 수 없다.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('카카오 로그인을 이용해주세요')
    expect(screen.getByLabelText(/이메일 주소/)).toHaveAttribute('aria-invalid', 'true')
    // 토스트로 띄우면 사라져서 안내를 다시 볼 수 없다. 화면에 남기고 갈 곳도 준다.
    expect(screen.getByRole('link', { name: '로그인 화면으로 이동' })).toHaveAttribute(
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

  it('카카오 콜백이 남긴 자리가 있으면 프로필 완료 뒤 그리로 돌아간다', async () => {
    // 위시리스트 가려다 카카오로 가입한 사람이 가입 후 홈에 떨어지면 안 된다.
    const router = createMemoryRouter(
      [
        { path: '/signup', Component: SignupPage },
        { path: '/wishlist', element: <h1>위시리스트</h1> },
        { path: '/', element: <h1>메인</h1> },
      ],
      {
        initialEntries: [{ pathname: '/signup', state: { step: 'profile', from: '/wishlist' } }],
      },
    )
    render(<RouterProvider router={router} />)

    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: 'yeonju lim' } })
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/wishlist'))
  })

  it('이미 추가 정보가 등록된 회원이면 오류 대신 성공과 같은 길로 보낸다', async () => {
    // 409(PROFILE_ALREADY_REGISTERED)는 가입이 끝나 있다는 뜻이라 createProfile이
    // 멱등 성공(null)으로 삼킨다. 화면은 회원 정보 없이도 제자리로 보내야 한다 —
    // 여권 404 안내를 타고 온 계정이 특히 그렇다.
    createProfile.mockResolvedValue(null)
    const router = createMemoryRouter(
      [
        { path: '/signup', Component: SignupPage },
        { path: '/boarding-pass/passport', element: <h1>여권</h1> },
      ],
      {
        initialEntries: [
          { pathname: '/signup', state: { step: 'profile', from: '/boarding-pass/passport' } },
        ],
      },
    )
    render(<RouterProvider router={router} />)

    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: 'yeonju lim' } })
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/passport'))
  })

  it('프로필이 미완성이면 state 없이 들어와도 여권 정보 단계부터 연다', async () => {
    // 프로필 화면에서 이탈했다 돌아온 사용자다. 계정은 이미 있으므로 계정
    // 단계를 다시 보여 주면 있는 계정으로 또 가입하라는 화면이 된다.
    setProfilePending(true)

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <SignupPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/이메일 주소/)).not.toBeInTheDocument()
  })

  it('이메일에 친 공백은 걷어내고 이유를 알린다', () => {
    // 이메일에 공백은 어차피 유효하지 않다. 특히 모바일 자동완성의 꼬리
    // 공백은 눈에 안 보여, 조용히 지우면 지운 적 없는 글자가 사라진 것처럼
    // 보인다.
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    const email = screen.getByLabelText(/이메일 주소/)
    fireEvent.change(email, { target: { value: ' a@b .c ' } })

    expect(email.value).toBe('a@b.c')
    expect(screen.getByText('이메일에는 공백을 입력할 수 없습니다')).toBeInTheDocument()

    // 공백 없이 다시 치면 안내도 사라진다. 같은 값이면 React가 change를
    // 생략하므로 다른 값으로 잇는다.
    fireEvent.change(email, { target: { value: 'a@b.cd' } })
    expect(screen.queryByText('이메일에는 공백을 입력할 수 없습니다')).not.toBeInTheDocument()
  })

  it('비밀번호에 친 공백도 걷어내고 이유를 알린다', () => {
    // 가려진 채 입력되는 칸이라 공백은 별표만 늘어 오타와 구분되지 않는다.
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    const password = screen.getByLabelText(/비밀번호/)
    fireEvent.change(password, { target: { value: 'Pass w0rd! ' } })

    expect(password.value).toBe('Passw0rd!')
    expect(screen.getByText('비밀번호에는 공백을 입력할 수 없습니다')).toBeInTheDocument()

    // 공백 없이 다시 치면 안내도 사라진다. 같은 값이면 React가 change를
    // 생략하므로 다른 값으로 잇는다.
    fireEvent.change(password, { target: { value: 'Passw0rd!!' } })
    expect(screen.queryByText('비밀번호에는 공백을 입력할 수 없습니다')).not.toBeInTheDocument()
  })

  it('규칙에 못 미치는 비밀번호는 서버까지 보내지 않고 무엇이 모자란지 보여 준다', async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    // 아무것도 치기 전에는 미충족 표시를 켜지 않는다. 혼내는 화면처럼 보인다.
    expect(screen.queryByText(/아직 충족하지 않음/)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/이메일 주소/), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText(/비밀번호/), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(signup).not.toHaveBeenCalled()
    // 대문자·숫자·특수문자 세 가지가 빠졌다.
    expect(screen.getAllByText(/아직 충족하지 않음/)).toHaveLength(3)
    expect(screen.queryByLabelText(/이름/)).not.toBeInTheDocument()
  })

  it('실패를 한 번 보여 준 뒤 다음 동작이 오면 계정 칸을 비운다', async () => {
    signup.mockRejectedValue(
      Object.assign(new Error('이미 가입된 이메일입니다'), {
        name: 'ApiError',
        status: 409,
        code: 'EMAIL_ALREADY_REGISTERED',
      }),
    )

    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    const email = screen.getByLabelText(/이메일 주소/)
    const password = screen.getByLabelText(/비밀번호/)
    fireEvent.change(email, { target: { value: 'a@b.c' } })
    fireEvent.change(password, { target: { value: 'Passw0rd!' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await screen.findByRole('alert')
    // 실패하자마자 비우면 방금 무엇을 넣었는지 확인할 새가 없다.
    expect(email).toHaveValue('a@b.c')

    // 같은 이메일로는 결과가 같다. 다음 동작이 오면 처음부터 치게 한다.
    fireEvent.pointerDown(email)

    expect(email).toHaveValue('')
    expect(password).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
