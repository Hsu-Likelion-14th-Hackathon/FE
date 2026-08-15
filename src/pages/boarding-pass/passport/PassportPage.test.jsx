import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'
import { triggerResize } from '@/test/setup.js'
import { Component as PassportPage } from './PassportPage.jsx'
import { passportTicket } from './passportData.js'

vi.mock('three/addons/renderers/CSS3DRenderer.js', async (importOriginal) => {
  const actual = await importOriginal()

  class FailingRenderer {
    constructor() {
      throw new Error('renderer failed')
    }
  }

  return { ...actual, CSS3DRenderer: FailingRenderer }
})

beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}))
afterEach(() => vi.restoreAllMocks())

function renderPassport() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/passport', Component: PassportPage },
      { path: '/boarding-pass', element: <p>Boarding</p> },
      { path: '/products', element: <p>Products</p> },
    ],
    { initialEntries: ['/boarding-pass/passport'] },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

describe('PassportPage', { timeout: 15_000 }, () => {
  it('여행 기록에서 1F 상세와 티켓을 열고 Escape로 닫는다', { timeout: 15_000 }, async () => {
    renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const historyTrigger = screen.getByRole('button', { name: 'TRAVEL HISTORY' })
    fireEvent.click(historyTrigger)
    expect(screen.getByRole('dialog', { name: '여행 기록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }))
    expect(screen.getByRole('dialog', { name: '1F JOURNEY 상세' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: '티켓 보기' }))
    expect(screen.getByRole('dialog', { name: '탑승권' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it(
    '시트가 열린 동안 헤더와 콘텐츠를 inert로 만들고 상단 닫기는 시트만 닫는다',
    { timeout: 15_000 },
    async () => {
      const router = renderPassport()
      const nextButton = screen.getByRole('button', { name: '다음 단계' })
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)

      const historyTrigger = screen.getByRole('button', { name: 'TRAVEL HISTORY' })
      fireEvent.click(historyTrigger)
      expect(screen.getByRole('progressbar').closest('[inert]')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: '메뉴 열기' }).closest('[inert]'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: '닫기' }).closest('[inert]'),
      ).not.toBeInTheDocument()
      fireEvent.keyDown(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }), {
        key: 'Tab',
      })
      expect(
        screen.getByRole('button', { name: '메뉴 열기' }).closest('[inert]'),
      ).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '닫기' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/boarding-pass/passport')
      await waitFor(() => expect(historyTrigger).toHaveFocus())
    },
  )

  it('시트가 열린 동안 pointer 제스처로 여권 단계를 바꾸지 않는다', () => {
    renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(screen.getByRole('button', { name: 'TRAVEL HISTORY' }))
    const surface = screen.getByTestId('passport-turn-surface')
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({ width: 400 })

    fireEvent.pointerDown(surface, {
      pointerId: 1,
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 220, clientY: 100 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 220, clientY: 100 })

    expect(screen.getByRole('progressbar', { hidden: true })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
  })

  it('시트 배경을 클릭하면 닫고 원래 트리거에 포커스를 복원한다', async () => {
    renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const historyTrigger = screen.getByRole('button', { name: 'TRAVEL HISTORY' })
    fireEvent.click(historyTrigger)
    fireEvent.click(screen.getByRole('button', { name: '시트 배경 닫기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(historyTrigger).toHaveFocus())
  })

  it('시트가 없을 때 상단 닫기는 보딩패스로 이동한다', () => {
    const router = renderPassport()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('25%에서 시작해 네 단계 사이만 이동한다', () => {
    renderPassport()

    const progress = screen.getByRole('progressbar', { name: '여권 진행률' })
    expect(progress).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByRole('button', { name: '이전 단계' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(progress).toHaveAttribute('aria-valuenow', '50')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(progress).toHaveAttribute('aria-valuenow', '75')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(progress).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('button', { name: '다음 단계' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '티켓 보기' })).toBeInTheDocument()
  })

  it('각 여권 단계를 보이고 이전 단계로 돌아간다', () => {
    renderPassport()

    expect(screen.getByRole('region', { name: '여권 표지' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('region', { name: '여권 프로필' })).toHaveTextContent('0001')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const stamps = screen.getByRole('region', { name: '여권 방문 스탬프' })
    expect(stamps).toHaveTextContent('총 방문 횟수 | 6회')
    expect(window.getComputedStyle(screen.getByText('총 방문 횟수 | 6회')).borderRadius).toBe(
      '0.5rem',
    )
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('region', { name: '여권 여행 기록' })).toHaveTextContent('MCM HAUS')

    fireEvent.click(screen.getByRole('button', { name: '이전 단계' }))
    expect(screen.getByRole('progressbar', { name: '여권 진행률' })).toHaveAttribute(
      'aria-valuenow',
      '75',
    )
    expect(screen.getByRole('region', { name: '여권 방문 스탬프' })).toBeInTheDocument()
  })

  it('닫기 버튼으로 보딩패스 경로로 이동한다', () => {
    const router = renderPassport()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(router.state.location.pathname).toBe('/boarding-pass')
  })

  it('티켓 시트는 막대 없이 스크롤하고 짧은 화면에서 티켓을 줄인다', () => {
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(screen.getByRole('button', { name: '티켓 보기' }))

    const sheet = screen.getByRole('dialog', { name: '탑승권' })
    const style = window.getComputedStyle(sheet)

    // 시트가 화면을 덮는 형태라 막대가 뜨면 둥근 모서리 위로 회색 띠가 지나간다.
    expect(style.scrollbarWidth).toBe('none')
    expect(style.overflowY).toBe('auto')

    // 티켓은 접히지 않는 한 장이라 짧은 화면에서 넘친다. 배율과 시트 위치를
    // 뷰포트에 묶어 둔다. 기준이 100svh라 주소창·툴바가 이미 반영된다.
    expect(style.getPropertyValue('--ticket-scale')).toContain('--mcm-viewport-stable')
    expect(style.getPropertyValue('--ticket-sheet-top')).toContain('--mcm-viewport-stable')
    // 길이를 숫자로 나누면 clamp가 무효가 되어 transform이 통째로 버려진다.
    expect(style.getPropertyValue('--ticket-scale')).toContain('423px')
    // 비세토스 바탕은 jsdom이 다층 url() 배경을 풀지 않아 여기서 못 본다.
    // 브라우저에서 확인했다.
  })

  it('닫기 버튼을 본문보다 위에 둬 44px이 가려지지 않게 한다', () => {
    renderPassport()

    const close = screen.getByRole('button', { name: '닫기' })
    const content = close.parentElement.querySelector('[class*=content]')

    // 둘 다 z-index 1이면 DOM에서 뒤에 오는 .content가 이겨 버튼 오른쪽을
    // 덮었다. 보이는 X가 통째로 가려져 왼쪽 15px만 눌렸다.
    // jsdom은 hit-test를 하지 않아 쌓임 순서로만 확인한다.
    const closeZ = Number(window.getComputedStyle(close).zIndex)
    const contentZ = Number(window.getComputedStyle(content).zIndex)
    expect(closeZ).toBeGreaterThan(contentZ)
  })

  it('네이티브 키보드 클릭으로 한 단계만 이동하고 닫기 버튼에 44px 터치 영역을 준다', () => {
    renderPassport()

    const next = screen.getByRole('button', { name: '다음 단계' })
    next.focus()
    fireEvent.keyDown(next, { key: 'Enter' })
    fireEvent.click(next)
    expect(screen.getByRole('progressbar', { name: '여권 진행률' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
    expect(window.getComputedStyle(screen.getByRole('button', { name: '닫기' })).width).toBe(
      '2.75rem',
    )
  })

  it('스테이지 패딩을 고정 높이 안에 포함한다', () => {
    renderPassport()

    const stage = screen
      .getByRole('region', { name: '여권 표지' })
      .closest('[data-testid="passport-turn-surface"]')
    expect(window.getComputedStyle(stage).boxSizing).toBe('border-box')
  })

  it('subtracts the shared header and safe top from the stage height', () => {
    renderPassport()

    const stage = screen.getByRole('heading', { level: 2, name: 'MCM PASSPORT' }).closest('section')

    expect(stage.style.minHeight).toBe(
      'calc(var(--mcm-viewport-stable) - var(--mcm-header-height) - var(--mcm-safe-top))',
    )
  })

  it('모든 단계에 여권 안내 카피와 상세 여행 콘텐츠를 제공한다', () => {
    renderPassport()

    // 브랜드 문구만 남긴다. 안내 두 줄은 랜딩에서 이미 읽었고, 걷어낸 자리는
    // 지면 크기로 돌아간다. (같은 문구가 브랜드 스트립 sr-only에도 있어
    // 화면 전체에서 찾으면 둘이 잡힌다.)
    const intro = document.querySelector('[class*=introCopy]')
    expect(intro).toHaveTextContent('MCM BOARDING PASS')
    expect(intro.children).toHaveLength(1)
    expect(
      screen.queryByText('당신의 MCM 비행에 완벽한 맞춤형 동선을 추천합니다'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('이 행사는 MCM HAUS 매장 기반으로 진행됩니다'),
    ).not.toBeInTheDocument()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(screen.getByRole('button', { name: 'TRAVEL HISTORY' }))
    fireEvent.click(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }))

    expect(screen.getByText('1976년, München - 밤의 도시가 낳은 대담함')).toBeInTheDocument()
    expect(screen.getByText('Modern Creation München')).toBeInTheDocument()
    expect(screen.getByText(/미하엘 크로머\(Michael Cromer\)/)).toBeInTheDocument()
    expect(screen.getByText(/‘어디론가 떠날 수 있는 태도’를/)).toBeInTheDocument()
    expect(passportTicket.to.localName).toBe('MCM')
    expect(screen.getByRole('dialog', { name: '1F JOURNEY 상세' })).not.toHaveTextContent('TICKET')
  })

  it('열린 여권 원본의 투명 여백만 장면 밖으로 잘라낸다', () => {
    renderPassport()

    const coverImage = screen.getByRole('region', { name: '여권 표지' }).querySelector('img')
    expect(window.getComputedStyle(coverImage).position).not.toBe('absolute')

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const openPassport = screen.getByRole('region', { name: '여권 프로필' })
    const openImage = openPassport.querySelector('img')
    const profile = openPassport.querySelector('h3').parentElement
    const openImageStyle = window.getComputedStyle(openImage)

    // 낱장 설계 크기를 그대로 두고 --passport-scale로 통째로 줄인다.
    // 내지 좌표가 394 기준 rem이라 폭만 줄이면 안쪽 버튼이 그림과 어긋난다.
    expect(window.getComputedStyle(openPassport).width).toBe('15.84375rem')
    expect(window.getComputedStyle(openPassport).transform).toBe('scale(var(--passport-scale, 1))')
    expect(window.getComputedStyle(openPassport).isolation).toBe('isolate')
    expect(openImageStyle.position).toBe('absolute')
    expect(openImageStyle.maxWidth).toBe('none')
    expect(openImageStyle.width).toBe('120.43%')
    expect(openImageStyle.height).toBe('122.36%')
    expect(openImageStyle.left).toBe('-10.21%')
    expect(openImageStyle.top).toBe('-11.8%')
    // 캔버스가 26px 간격으로 그린다(줄 높이 16 + 사이 10, Figma 120:263).
    // 어긋나면 클릭 영역과 이름 호버 밑줄이 글자에서 밀린다.
    expect(window.getComputedStyle(profile).gap).toBe('0.625rem')
    // 캔버스는 행을 197px 폭에 그리고 값을 오른쪽 끝에 맞춘다.
    expect(window.getComputedStyle(profile).width).toBe('12.3125rem')
  })

  it('프로필 제품 CTA와 현재 여권 단계 정보를 제공한다', async () => {
    const router = renderPassport()
    const progress = screen.getByRole('progressbar', { name: '여권 진행률' })

    expect(progress).toHaveAttribute('aria-valuetext', '1단계 / 4단계')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(progress).toHaveAttribute('aria-valuetext', '2단계 / 4단계')

    const products = screen.getByRole('button', { name: '제품 보러가기' })
    // 상자는 글자에 딱 맞아야 한다. min-height로 키우면 flex 줄 높이가 같이
    // 커지고, 그 줄은 아래가 고정이라 위로 자라 글자가 캔버스보다 올라간다.
    expect(window.getComputedStyle(products).minHeight).toBe('')
    expect(window.getComputedStyle(products).minWidth).toBe('')
    // 44px 터치 영역은 레이아웃 밖(::after)에서 확보한다. jsdom은 가상 요소
    // 스타일을 계산하지 않아 여기서는 확인할 수 없다.
    expect(window.getComputedStyle(products).position).toBe('relative')
    fireEvent.click(products)
    await waitFor(() => expect(router.state.location.pathname).toBe('/products'))
  })

  it('최종 단계 장식을 투명 비행기와 티켓 레이어를 담은 두 카드로 구성한다', () => {
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(next)

    expect(screen.getByRole('heading', { name: 'PASSPORT' })).toBeInTheDocument()
    const artwork = screen.getByRole('img', { name: '비행기와 탑승권' })
    expect(artwork.children).toHaveLength(2)
    expect(artwork.querySelectorAll('img')).toHaveLength(3)
    for (const card of artwork.children) {
      expect(window.getComputedStyle(card).backgroundColor).toBe('rgb(29, 12, 0)')
    }
  })

  it('이름 수정 시트는 입력칸부터 잡고 조합 중인 한글은 저장하지 않는다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    fireEvent.click(screen.getByRole('button', { name: /이름 .* 수정/ }))
    const input = screen.getByLabelText('여권에 표기할 영문 이름')
    expect(input).toHaveFocus()

    // 조합이 끝나기 전에 제출해도 허용되지 않는 글자는 걸러진다.
    fireEvent.change(input, { target: { value: '홍길동' } })
    fireEvent.submit(input.closest('form'))
    expect(screen.getByRole('dialog', { name: '여권 신분 정보 수정' })).toBeInTheDocument()

    fireEvent.change(input, { target: { value: "o'brien kim" } })
    fireEvent.submit(input.closest('form'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: '여권 프로필' })).toHaveTextContent("O'BRIEN KIM")
  })

  it('생년월일과 국적도 같은 시트에서 고치고 지면 표기로 되돌린다', async () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    // 백엔드가 셋을 한 번에 받으므로(UserUpdateRequest) 어느 줄을 눌러도 같은 시트다.
    fireEvent.click(screen.getByRole('button', { name: /생년월일 .* 수정/ }))
    const sheet = screen.getByRole('dialog', { name: '여권 신분 정보 수정' })

    // 수정 칸은 시트를 열 때 따로 받아온다(lazy). 국가 목록 223개까지 함께
    // 들어와 기본 1초로는 모자란다.
    await screen.findByRole('button', { name: '연도' }, { timeout: 5000 })
    // 달력은 ISO를 다룬다. 지면 표기(2000 01 01)를 그대로 주면 값을 못 읽는다.
    expect(sheet.querySelector('input[name="birthDate"]')).toHaveValue('2000-01-01')
    expect(sheet.querySelector('input[name="nationality"]')).toHaveValue('KOR')

    // 지면에도 '국적 ... 수정' 버튼이 있어 시트 안으로 좁힌다.
    fireEvent.click(within(sheet).getByRole('button', { name: /^국적/ }))
    // 250개 나라를 이름으로 훑으면 jsdom에서 몇 초가 걸린다. 실제 사용자도
    // 검색으로 좁히므로 같은 경로를 쓴다.
    fireEvent.change(screen.getByRole('searchbox', { name: '국가 검색' }), {
      target: { value: 'Japan' },
    })
    fireEvent.click(await screen.findByRole('option', { name: '日本 (Japan)' }))
    fireEvent.submit(screen.getByLabelText('여권에 표기할 영문 이름').closest('form'))

    // 공식 국명은 최대 46자라 지면에서 잘린다. 실제 여권처럼 alpha-3을 찍는다.
    const profile = screen.getByRole('region', { name: '여권 프로필' })
    expect(profile).toHaveTextContent('JPN')
    expect(profile).toHaveTextContent('2000 01 01')
  })

  it('조합이 끝나기 전에 제출하면 저장하지 않고 시트를 열어 둔다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    fireEvent.click(screen.getByRole('button', { name: /이름 .* 수정/ }))
    const input = screen.getByLabelText('여권에 표기할 영문 이름')

    // 영문을 친 뒤 한글 조합을 시작한 상태. 여기서 제출하면 영문만 남기고
    // 닫혀 버려, 지운 적 없는 글자가 사라진 것처럼 보인다.
    fireEvent.change(input, { target: { value: 'GIL' } })
    fireEvent.compositionStart(input, { data: 'ㅎ' })
    fireEvent.change(input, { target: { value: 'GIL홍' } })
    fireEvent.submit(input.closest('form'))

    expect(screen.getByRole('dialog', { name: '여권 신분 정보 수정' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '여권 프로필', hidden: true })).not.toHaveTextContent(
      'GIL',
    )

    // 조합이 끝나면 평소대로 저장된다.
    fireEvent.compositionEnd(input, { target: { value: 'GIL홍' } })
    fireEvent.submit(input.closest('form'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: '여권 프로필' })).toHaveTextContent('GIL')
  })

  it('이름을 여권 표기 한도로 자르고 넘치면 말줄임으로 가린다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    fireEvent.click(screen.getByRole('button', { name: /이름 .* 수정/ }))
    const input = screen.getByLabelText('여권에 표기할 영문 이름')

    // ICAO 9303 MRZ 이름 칸이 39자다. 길이를 열어 두면 지면 밖으로 넘친다.
    expect(input).toHaveAttribute('maxLength', '39')
    fireEvent.change(input, { target: { value: 'A'.repeat(60) } })
    expect(input).toHaveValue('A'.repeat(39))

    fireEvent.submit(input.closest('form'))
    // 국적·생년월일도 같은 버튼 구조라 지면에서 첫 button을 집으면 안 된다.
    const value = screen.getByRole('button', { name: /이름 .* 수정/ }).querySelector('strong')
    expect(value).toHaveTextContent('A'.repeat(39))
    // 39자도 197px 행보다 길다. 잘라서 보여 줘야 라벨을 덮지 않는다.
    const style = window.getComputedStyle(value)
    expect(style.textOverflow).toBe('ellipsis')
    expect(style.whiteSpace).toBe('nowrap')
    expect(style.minWidth).toBe('0px')
    // 열이 내용 크기면 글자가 제 폭을 그대로 차지해 말줄임이 걸리지 않는다.
    expect(window.getComputedStyle(value.closest('button')).gridTemplateColumns).toBe(
      'minmax(0, 1fr)',
    )
  })

  it('짧은 이름도 캔버스처럼 행 오른쪽 끝에 붙인다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const value = screen.getByRole('button', { name: /이름 .* 수정/ }).querySelector('strong')

    // 캔버스는 값을 행 오른쪽 끝에 그린다. 이름이 짧으면 버튼이 44px까지
    // 넓어지는데, 글자가 왼쪽에 붙으면 그림과 37px 어긋난다.
    const style = window.getComputedStyle(value)
    expect(style.justifySelf).toBe('end')
    // end는 글자를 내용 크기로 잡는다. 열에 묶어 둬야 긴 이름 말줄임이 남는다.
    expect(style.maxWidth).toBe('100%')
  })

  it('이름 버튼의 44px 클릭 영역을 행이 잘라내지 않는다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    const button = screen.getByRole('button', { name: /이름 .* 수정/ })
    // 행 높이는 16px인데 버튼은 44px이다. 행에 overflow: hidden이 걸리면
    // 위아래로 튀어나온 클릭 영역이 통째로 잘려 16px만 남는다.
    // jsdom은 실제 hit-test를 하지 않아 잘림 여부는 스타일로만 확인한다.
    // jsdom은 선언하지 않은 속성을 ''로 준다. 값이 hidden이 아니어야 한다는 게 요점이다.
    expect(window.getComputedStyle(button.closest('p')).overflow).not.toBe('hidden')
    expect(window.getComputedStyle(button).minHeight).toBe(
      'calc(2.75rem / var(--passport-scale, 1))',
    )
  })

  it('신분면 행 글꼴을 캔버스와 같게 둔다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const row = screen.getByRole('button', { name: /이름 .* 수정/ }).closest('p')

    // 캔버스 drawRow가 600 10px으로 그린다. DOM이 더 크면 글자 상자가 그림보다
    // 넓어져, 클릭 영역과 호버 밑줄이 실제 글자 밖까지 뻗는다.
    expect(window.getComputedStyle(row).fontSize).toBe('0.625rem')
    expect(window.getComputedStyle(row).fontWeight).toBe('600')
    // strong의 기본값 bolder는 부모 600을 900으로 올린다.
    expect(window.getComputedStyle(row.querySelector('strong')).fontWeight).toBe('600')
  })

  it('이름에 호버하면 캔버스 위에 수정 가능 표시를 얹는다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const button = screen.getByRole('button', { name: /이름 .* 수정/ })

    // 내용 DOM은 캔버스와 겹치지 않게 opacity 0이라, 버튼 안에 그리면 보이지
    // 않는다. 표시는 투명 레이어 밖에 있어야 한다.
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()

    fireEvent.pointerEnter(button)
    const cue = screen.getByTestId('passport-name-cue')
    expect(cue.closest('[class*=contentLayer]')).toBeNull()
    // 무엇을 하는 버튼인지도 알려야 밑줄만 보고 헤매지 않는다.
    expect(cue).toHaveTextContent('이름 수정')

    fireEvent.pointerLeave(button)
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()

    // 키보드 사용자도 같은 표시를 받아야 한다.
    act(() => button.focus())
    expect(screen.getByTestId('passport-name-cue')).toBeInTheDocument()
    act(() => button.blur())
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()
  })

  it('호버와 포커스를 따로 세어 둘 다 풀렸을 때만 표시를 지운다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const button = screen.getByRole('button', { name: /이름 .* 수정/ })

    // 키보드로 이름에 머문 채 마우스가 스쳐 지나간 상황.
    act(() => button.focus())
    fireEvent.pointerEnter(button)
    fireEvent.pointerLeave(button)
    expect(screen.getByTestId('passport-name-cue')).toBeInTheDocument()

    // 반대로 마우스를 올려 둔 채 포커스만 다른 곳으로 간 상황.
    fireEvent.pointerEnter(button)
    act(() => button.blur())
    expect(screen.getByTestId('passport-name-cue')).toBeInTheDocument()

    fireEvent.pointerLeave(button)
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()
  })

  it('지면을 넘겼다 돌아오면 남은 호버 상태를 들고 있지 않는다', () => {
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)

    fireEvent.pointerEnter(screen.getByRole('button', { name: /이름 .* 수정/ }))
    expect(screen.getByTestId('passport-name-cue')).toBeInTheDocument()

    // 손을 올린 채 키보드로 넘기면 버튼이 사라져 pointerleave가 오지 않는다.
    fireEvent.click(next)
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '이전 단계' }))

    // 돌아온 뒤 포커스만 스쳤을 뿐인데 지난 호버가 남아 표시가 붙어 있었다.
    const button = screen.getByRole('button', { name: /이름 .* 수정/ })
    act(() => button.focus())
    act(() => button.blur())
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()
  })

  it('이름 수정 시트를 닫으면 남은 호버 표시를 거둔다', async () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const button = screen.getByRole('button', { name: /이름 .* 수정/ })

    // 손을 올린 채로 누르면 시트가 열리고 지면은 inert가 된다. 포인터
    // 이벤트가 끊겨 pointerleave가 오지 않는다.
    fireEvent.pointerEnter(button)
    fireEvent.click(button)
    expect(screen.getByRole('dialog', { name: '여권 신분 정보 수정' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // 닫히면 초점이 이름 버튼으로 돌아온다. 그래도 손이 없으면 표시는 없다.
    await waitFor(() => expect(button).toHaveFocus())
    expect(screen.queryByTestId('passport-name-cue')).not.toBeInTheDocument()
  })

  it('창 크기가 바뀌면 밑줄 좌표를 다시 잰다', () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const button = screen.getByRole('button', { name: /이름 .* 수정/ })
    const strong = button.querySelector('strong')

    act(() => button.focus())
    expect(screen.getByTestId('passport-name-cue')).toHaveStyle({ left: '0px' })

    // 지면이 줄면 이름도 움직인다. 좌표를 그대로 두면 밑줄만 남는다.
    vi.spyOn(strong, 'getBoundingClientRect').mockReturnValue({
      left: 40,
      top: 12,
      right: 96,
      bottom: 28,
      width: 56,
      height: 16,
    })
    act(() => triggerResize())

    expect(screen.getByTestId('passport-name-cue')).toHaveStyle({ left: '40px', width: '56px' })
  })
})
