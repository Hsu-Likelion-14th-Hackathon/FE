import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'
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

describe('PassportPage', () => {
  it('여행 기록에서 1F 상세와 티켓을 열고 Escape로 닫는다', async () => {
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

  it('시트가 열린 동안 Chrome과 콘텐츠를 inert로 만들고 상단 닫기는 시트만 닫는다', async () => {
    const router = renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const historyTrigger = screen.getByRole('button', { name: 'TRAVEL HISTORY' })
    fireEvent.click(historyTrigger)
    expect(screen.getByRole('progressbar').closest('[inert]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메뉴 열기' }).closest('[inert]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '닫기' }).closest('[inert]')).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }), {
      key: 'Tab',
    })
    expect(screen.getByRole('button', { name: '메뉴 열기' }).closest('[inert]')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/boarding-pass/passport')
    await waitFor(() => expect(historyTrigger).toHaveFocus())
  })

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

    expect(
      screen.getByText('당신의 MCM 비행에 완벽한 맞춤형 동선을 추천합니다'),
    ).toBeInTheDocument()
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
    expect(window.getComputedStyle(profile).gap).toBe('1rem')
  })

  it('프로필 제품 CTA와 현재 여권 단계 정보를 제공한다', async () => {
    const router = renderPassport()
    const progress = screen.getByRole('progressbar', { name: '여권 진행률' })

    expect(progress).toHaveAttribute('aria-valuetext', '1단계 / 4단계')
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(progress).toHaveAttribute('aria-valuetext', '2단계 / 4단계')

    const products = screen.getByRole('button', { name: '제품 보러가기' })
    // 지면이 줄면 안쪽 버튼도 같이 줄어든다. 배율의 역수를 곱해 화면에서
    // 차지하는 크기를 44px로 유지한다.
    expect(window.getComputedStyle(products).minHeight).toBe(
      'calc(2.75rem / var(--passport-scale, 1))',
    )
    expect(window.getComputedStyle(products).minWidth).toBe(
      'calc(2.75rem / var(--passport-scale, 1))',
    )
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
})
