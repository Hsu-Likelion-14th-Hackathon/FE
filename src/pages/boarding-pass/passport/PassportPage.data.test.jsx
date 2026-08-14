import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

import { Component as PassportPage } from './PassportPage.jsx'

/**
 * 캔버스와 투명 DOM이 같은 데이터를 쓰는지 본다.
 *
 * 고정 데이터(passportData.js)와 같은 값으로 응답하면 DOM이 상수를 읽든 조회
 * 결과를 읽든 똑같이 통과한다. 그래서 일부러 전부 다른 값을 준다. 모듈 목은
 * 파일 단위라 이 검사만 따로 둔다.
 */
const FETCHED_PROFILE = {
  passportNumber: '4242',
  name: 'ADA LOVELACE',
  nationality: 'UNITED KINGDOM',
  birthDate: '1815 12 10',
  issueDate: '2026 01 02',
  credit: 7,
  visits: 2,
}

const FETCHED_STAMPS = [
  { id: 'stamp-a', date: '2026 03 03' },
  { id: 'stamp-b', date: '2026 04 04' },
]

vi.mock('@/shared/api/passportApi.js', () => ({
  getPassport: vi.fn(async () => FETCHED_PROFILE),
  getPassportStamps: vi.fn(async () => ({
    visits: FETCHED_PROFILE.visits,
    stamps: FETCHED_STAMPS,
  })),
  getVisitDetail: vi.fn(async () => ({})),
}))

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

describe('여권 DOM 데이터', () => {
  it('신분면의 모든 칸을 조회한 여권으로 채운다', async () => {
    renderPassport()
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    const profile = await screen.findByRole('region', { name: '여권 프로필' })
    await waitFor(() => expect(profile).toHaveTextContent(FETCHED_PROFILE.passportNumber))
    // 고정 데이터를 읽으면 여기서 0001 / REPUBLIC OF KOREA / 100이 나온다.
    expect(profile).toHaveTextContent(FETCHED_PROFILE.nationality)
    expect(profile).toHaveTextContent(FETCHED_PROFILE.name)
    expect(profile).toHaveTextContent(FETCHED_PROFILE.birthDate)
    expect(profile).toHaveTextContent(FETCHED_PROFILE.issueDate)
    expect(profile).toHaveTextContent(String(FETCHED_PROFILE.credit))
    expect(profile).not.toHaveTextContent('REPUBLIC OF KOREA')
  })

  it('방문 스탬프 면의 횟수와 날짜를 조회한 스탬프로 채운다', async () => {
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)

    const stamps = await screen.findByRole('region', { name: '여권 방문 스탬프' })
    await waitFor(() => expect(stamps).toHaveTextContent('총 방문 횟수 | 2회'))
    expect(stamps.querySelectorAll('li')).toHaveLength(FETCHED_STAMPS.length)
    for (const stamp of FETCHED_STAMPS) {
      expect(stamps).toHaveTextContent(stamp.date)
    }
    // 고정 데이터 6개가 섞여 들어오면 안 된다.
    expect(stamps).not.toHaveTextContent('2026 07 21')
  })
})
