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
  { id: 'stamp-a', visitLogId: 4, date: '2026 03 03' },
  { id: 'stamp-b', visitLogId: 9, date: '2026 04 04' },
]

/** 채움 데이터(MCM HAUS)와 겹치지 않는 값으로 채워 어느 쪽을 읽는지 가른다. */
const FETCHED_VISIT = {
  visitLogId: 9,
  storeName: 'MCM MUNICH',
  address: '1 Odeonsplatz, München',
  entryNo: '00777',
  visitedOn: '2026 05 05',
  stayMinutes: 12,
  passengerName: 'ADA LOVELACE',
  passCode: 'MCM-TEST-0505',
  boardingPassId: 77,
  travelHistory: [
    {
      id: 'floor-1',
      floorId: 11,
      floorNo: 1,
      code: 'JOURNEY',
      title: '여정',
      tagline: '뮌헨의 밤이 낳은 대담함',
    },
    {
      id: 'floor-2',
      floorId: 12,
      floorNo: 2,
      code: 'EMBLEM',
      title: '상징',
      tagline: '태도를 담은 로고',
    },
  ],
}

/** 그 방문의 보딩패스 동선 — 1층만 AI 추천이다. */
const FETCHED_ROUTE = [
  {
    sequence: 1,
    id: '1f',
    floorId: 11,
    floorNo: 1,
    code: 'JOURNEY',
    title: '여정',
    isRecommended: true,
    reason: '첫 여정으로 알맞습니다.',
  },
  {
    sequence: 2,
    id: '2f',
    floorId: 12,
    floorNo: 2,
    code: 'EMBLEM',
    title: '상징',
    isRecommended: false,
    reason: null,
  },
]

const getPassport = vi.hoisted(() => vi.fn())
const getVisitDetail = vi.hoisted(() => vi.fn())
const getPassportStamps = vi.hoisted(() => vi.fn())
const getBoardingPassRoute = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/passportApi.js', () => ({
  getPassport: (...args) => getPassport(...args),
  getPassportStamps: (...args) => getPassportStamps(...args),
  getVisitDetail: (...args) => getVisitDetail(...args),
}))

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getBoardingPassRoute: (...args) => getBoardingPassRoute(...args),
}))

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  getPassport.mockReset().mockResolvedValue(FETCHED_PROFILE)
  getPassportStamps
    .mockReset()
    .mockResolvedValue({ visits: FETCHED_PROFILE.visits, stamps: FETCHED_STAMPS })
  getVisitDetail.mockReset().mockResolvedValue(FETCHED_VISIT)
  getBoardingPassRoute.mockReset().mockResolvedValue(FETCHED_ROUTE)
})
afterEach(() => vi.restoreAllMocks())

function renderPassport() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/passport', Component: PassportPage },
      { path: '/boarding-pass', element: <p>Boarding</p> },
      { path: '/products', element: <p>Products</p> },
      { path: '/signup', element: <p>Signup</p> },
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

  it('스탬프를 누르면 그 방문의 여행 기록 면과 시트가 열린다', async () => {
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)

    // 넘겨서는 못 간다 — 어느 방문을 볼지 모르기 때문이다.
    expect(next).toBeDisabled()
    fireEvent.click(await screen.findByRole('button', { name: '2026 04 04 방문 기록 보기' }))

    const journey = await screen.findByRole('region', { name: '여권 여행 기록' })
    await waitFor(() => expect(journey).toHaveTextContent('MCM MUNICH'))
    expect(journey).toHaveTextContent('2026 05 05')
    expect(journey).toHaveTextContent('입장 번호 00777 | 비행 시간 12M')
    // 채움 데이터를 읽으면 여기서 MCM HAUS가 나온다.
    expect(journey).not.toHaveTextContent('MCM HAUS')

    // 누른 스탬프의 방문으로 조회한다.
    expect(getVisitDetail).toHaveBeenCalledWith(9)

    fireEvent.click(screen.getByRole('button', { name: 'TRAVEL HISTORY' }))
    const sheet = await screen.findByRole('dialog', { name: '여행 기록' })
    expect(sheet).toHaveTextContent('1F JOURNEY | 여정')
    expect(sheet).toHaveTextContent('뮌헨의 밤이 낳은 대담함')
    expect(sheet).not.toHaveTextContent('삶은 여행이다')

    // 동선의 AI 추천이 층 카드에 얹히고, 추천 층만 남는다.
    expect(getBoardingPassRoute).toHaveBeenCalledWith(77)
    const badges = await screen.findAllByLabelText('AI 추천 층')
    expect(badges).toHaveLength(1)
    expect(badges[0].closest('button')).toHaveAccessibleName('1F JOURNEY 상세 보기')
    // 비추천 2F는 기록 목록에서 빠진다.
    expect(sheet).not.toHaveTextContent('2F EMBLEM')
  })

  it('동선 조회가 실패해도 여행 기록은 추천 표시 없이 열린다', async () => {
    getBoardingPassRoute.mockRejectedValue(new Error('boom'))
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)

    fireEvent.click(await screen.findByRole('button', { name: '2026 04 04 방문 기록 보기' }))

    const journey = await screen.findByRole('region', { name: '여권 여행 기록' })
    await waitFor(() => expect(journey).toHaveTextContent('MCM MUNICH'))

    fireEvent.click(screen.getByRole('button', { name: 'TRAVEL HISTORY' }))
    const sheet = await screen.findByRole('dialog', { name: '여행 기록' })
    // 추천 표시가 없으니 걸러낼 근거도 없다 — 기록 전체를 보여 준다.
    expect(sheet).toHaveTextContent('1F JOURNEY | 여정')
    expect(sheet).toHaveTextContent('2F EMBLEM | 상징')
    expect(screen.queryByLabelText('AI 추천 층')).not.toBeInTheDocument()
  })

  it('방문이 없으면 스탬프 면을 채움 데이터로 메우지 않는다', async () => {
    // 방문한 적 없는 계정에 채움 스탬프 여섯 개를 찍으면 가짜 기록이 된다.
    getPassportStamps.mockResolvedValue({ visits: 0, stamps: [] })
    renderPassport()
    const nextButton = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(nextButton)
    fireEvent.click(nextButton)

    const stamps = await screen.findByRole('region', { name: '여권 방문 스탬프' })
    await waitFor(() => expect(stamps).toHaveTextContent('총 방문 횟수 | 0회'))
    expect(stamps.querySelectorAll('li')).toHaveLength(0)
    expect(stamps).not.toHaveTextContent('2026 07 21')
  })

  it('조회가 끝나기 전에는 채움 스탬프를 열 수 없다', async () => {
    // 채움 스탬프에는 방문 번호가 없다. 열면 가짜 방문이 상태에 박혀 진짜
    // 데이터가 온 뒤에도 남는다.
    getPassport.mockReturnValue(new Promise(() => {}))
    getPassportStamps.mockReturnValue(new Promise(() => {}))
    renderPassport()
    const next = screen.getByRole('button', { name: '다음 단계' })
    fireEvent.click(next)
    fireEvent.click(next)

    const stamps = await screen.findAllByRole('button', { name: /방문 기록 보기/ })
    expect(stamps).not.toHaveLength(0)
    for (const stamp of stamps) expect(stamp).toBeDisabled()
  })

  it('여권이 없으면 채움 여권 대신 만들기 안내를 열고 가입 2단계로 보낸다', async () => {
    // 채움 데이터로 덮으면 여권 없는 사용자가 남의 기록이 찍힌 여권을 보게 된다.
    getPassport.mockRejectedValue(
      Object.assign(new Error('발급 없습니다.'), { code: 'PASSPORT_NOT_FOUND' }),
    )
    const router = renderPassport()

    expect(await screen.findByText('아직 여권이 없습니다')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여권 표지' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '여권 만들기' }))
    await screen.findByText('Signup')
    // 프로필을 완성하면 여권으로 되돌아온다.
    expect(router.state.location.state).toEqual({
      step: 'profile',
      from: '/boarding-pass/passport',
    })
  })

  it('여권 조회가 실패하면 다시 시도할 수 있다', async () => {
    // 여권이 있는 사용자의 일시적 실패다. 만들기 안내를 띄우면 멀쩡한 여권을
    // 다시 만들라는 소리가 된다.
    getPassport.mockRejectedValueOnce(new Error('network down'))
    renderPassport()

    expect(await screen.findByRole('alert')).toHaveTextContent('여권을 불러오지 못했습니다')
    expect(screen.queryByText('아직 여권이 없습니다')).not.toBeInTheDocument()

    // 두 번째 호출은 성공한다(mockRejectedValueOnce) — 여권이 다시 열린다.
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('region', { name: '여권 표지' })).toBeInTheDocument()
    expect(getPassport).toHaveBeenCalledTimes(2)
  })
})
