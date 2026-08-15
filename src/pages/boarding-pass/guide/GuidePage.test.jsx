import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getFloors = vi.hoisted(() => vi.fn())
const getFloor = vi.hoisted(() => vi.fn())
const getLatestBoardingPass = vi.hoisted(() => vi.fn())
const getBoardingPassRoute = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/floorApi.js', () => ({
  getFloors: (...args) => getFloors(...args),
  getFloor: (...args) => getFloor(...args),
}))

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getLatestBoardingPass: (...args) => getLatestBoardingPass(...args),
  getBoardingPassRoute: (...args) => getBoardingPassRoute(...args),
}))

import AppProviders from '@/app/providers.jsx'

import { Component as GuidePage } from './GuidePage.jsx'

/** floorApi가 돌려주는 화면 모양 그대로 둔다. */
const FLOORS = [
  {
    id: '1f',
    floorId: 1,
    floorNo: 1,
    code: 'ORIGIN',
    title: '기원',
    subtitle: '1976, MÜNCHEN',
    tagline: '모든 여정은 하나의 이름에서 시작된다',
    audioUrl: null,
    badge: '1F ORIGIN  |  기원',
  },
  {
    id: '2f',
    floorId: 2,
    floorNo: 2,
    code: 'EMBLEM',
    title: '상징',
    subtitle: 'LAUREL & VISETOS',
    tagline: '로고는 브랜드의 태도를 담는다',
    audioUrl: null,
    badge: '2F EMBLEM  |  상징',
  },
  {
    id: '5f',
    floorId: 5,
    floorNo: 5,
    code: 'HORIZON',
    title: '지평',
    subtitle: 'THE NEXT 50 YEARS',
    tagline: '다음 50년을 향한 새로운 시작',
    audioUrl: null,
    badge: '5F HORIZON  |  지평',
  },
]

const FLOOR_1_DETAIL = {
  ...FLOORS[0],
  contents: [
    {
      orderNo: 1,
      blockType: 'TEXT',
      body: '1976년 뮌헨의 밤에서 시작된 이야기.',
      imageUrl: null,
      product: null,
    },
    { orderNo: 2, blockType: 'LIST', body: '1976년 뮌헨 창립', imageUrl: null, product: null },
    { orderNo: 3, blockType: 'LIST', body: '창립자 이니셜 MCM', imageUrl: null, product: null },
  ],
}

const activeRouters = []

function renderGuide() {
  const router = createMemoryRouter(
    [
      { path: '/boarding-pass/guide', Component: GuidePage },
      { path: '/boarding-pass/flight', element: <p>Flight</p> },
    ],
    { initialEntries: ['/boarding-pass/guide'] },
  )

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  activeRouters.push(router)
  return router
}

beforeEach(() => {
  getFloors.mockReset().mockResolvedValue({ storeName: 'MCM HAUS', floors: FLOORS })
  getFloor.mockReset().mockResolvedValue(FLOOR_1_DETAIL)
  getLatestBoardingPass.mockReset().mockResolvedValue({ boardingPassId: 7 })
  getBoardingPassRoute.mockReset().mockResolvedValue([
    {
      sequence: 1,
      id: '1f',
      floorId: 1,
      floorNo: 1,
      code: 'ORIGIN',
      title: '기원',
      isRecommended: true,
      reason: '기본 동선',
    },
    {
      sequence: 2,
      id: '5f',
      floorId: 5,
      floorNo: 5,
      code: 'HORIZON',
      title: '지평',
      isRecommended: false,
      reason: null,
    },
  ])
})

describe('GuidePage', { timeout: 15_000 }, () => {
  afterEach(() => {
    activeRouters.splice(0).forEach((router) => router.dispose())
  })

  it('개요 칩을 백엔드 층으로 위층부터 세우고 추천 층에 AI 마크를 단다', async () => {
    renderGuide()

    const chips = await screen.findAllByRole('button', { name: /F .* \|/ })
    // floorNo 내림차순 — 건물처럼 5F가 맨 위다.
    expect(chips[0]).toHaveTextContent('5F HORIZON')
    expect(chips[chips.length - 1]).toHaveTextContent('1F ORIGIN')
    // 추천 동선(route)의 isRecommended 층만 표시된다.
    expect(chips[chips.length - 1]).toHaveTextContent('✦ AI')
    expect(chips[0]).not.toHaveTextContent('✦ AI')
  })

  it('칩을 누르면 그 층의 콘텐츠 블록을 받아 그린다', async () => {
    renderGuide()

    fireEvent.click(await screen.findByRole('button', { name: /1F ORIGIN/ }))

    await waitFor(() => expect(getFloor).toHaveBeenCalledWith(1))
    expect(await screen.findByText('1976년 뮌헨의 밤에서 시작된 이야기.')).toBeInTheDocument()
    // LIST 블록은 목록으로 묶인다.
    const list = screen.getByRole('list')
    expect(list).toHaveTextContent('1976년 뮌헨 창립')
    expect(list).toHaveTextContent('창립자 이니셜 MCM')
    // 층 배지·인용도 백엔드 값이다.
    expect(screen.getByText('“ 모든 여정은 하나의 이름에서 시작된다 ”')).toBeInTheDocument()
  })

  it('returns to MAPS when the first slider segment is pressed', async () => {
    const router = renderGuide()

    fireEvent.click(screen.getByRole('button', { name: 'MAPS로 이동' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/boarding-pass/flight'))
  })

  it('층 목록이 실패하면 안내 카드와 다시 시도를 보여 준다', async () => {
    getFloors.mockRejectedValueOnce(new Error('층 안내를 불러오지 못했습니다.'))
    renderGuide()

    expect(await screen.findByRole('alert')).toHaveTextContent('층 안내를 불러오지 못했습니다.')

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('button', { name: /5F HORIZON/ })).toBeInTheDocument()
  })

  it('shows the AI note only on the travel guide overview', async () => {
    renderGuide()

    expect(screen.getByText('AI가 고객님만의 MCM 비행 가이드를 준비했습니다')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(
      screen.queryByText('AI가 고객님만의 MCM 비행 가이드를 준비했습니다'),
    ).not.toBeInTheDocument()
  })
})
