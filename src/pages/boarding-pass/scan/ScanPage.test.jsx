import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

const defaultPass = {
  id: 'MCM-BP-TEST',
  boardingPassId: 'MCM-BP-TEST',
  passCode: 'MCM-PASS-TEST',
  passengerName: 'YEONJU LIM',
  flightCode: 'MCM 6506',
  cabinClass: 'FIRST CLASS',
  from: { city: 'SEOUL', code: 'ICN', localName: '서울' },
  to: { city: 'MUNICH', code: 'MUC', localName: 'MCM' },
  gate: '1ST FLOOR',
  boardingLabel: 'TUE, 25 AUG 2026',
  timeStart: '11:00 AM',
  timeEnd: '20:00 PM',
}

const getLatestBoardingPass = vi.fn(async () => defaultPass)
const scanBoardingPass = vi.fn(async () => ({
  status: 'SUCCESS',
  credit: {
    amount: 100,
    label: 'AI 가상 피팅 크레딧',
    note: '비행 종료 후 Passport에서 확인하실 수 있습니다.',
  },
}))

vi.mock('@/shared/api/boardingPassApi.js', () => ({
  getLatestBoardingPass: (...args) => getLatestBoardingPass(...args),
  scanBoardingPass: (...args) => scanBoardingPass(...args),
}))

import { Component as ScanPage } from './ScanPage.jsx'

describe('ScanPage', () => {
  beforeEach(() => {
    scanBoardingPass.mockClear()
    getLatestBoardingPass.mockReset()
    getLatestBoardingPass.mockResolvedValue(defaultPass)
  })

  it('idle 상태에서 스캔 시뮬레이션 버튼을 보여준다', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <ScanPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(
      await screen.findByRole('button', { name: /평가용 탑승권 스캔 시뮬레이션/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('BOARDING PASS')).toBeInTheDocument()
  })

  it('시뮬 스캔 후 SUCCESS SCAN과 크레딧 토스트를 보여준다', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <ScanPage />
        </MemoryRouter>
      </AppProviders>,
    )

    const simButton = await screen.findByRole('button', {
      name: /평가용 탑승권 스캔 시뮬레이션/,
    })
    fireEvent.click(simButton)

    await waitFor(() => {
      expect(scanBoardingPass).toHaveBeenCalled()
    })
    expect(await screen.findByText('SUCCESS SCAN')).toBeInTheDocument()
    expect(screen.getByText(/AI 가상 피팅 크레딧이 지급되었습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비행 이륙하기' })).toBeInTheDocument()
  })

  it('latest가 없으면 영구 로딩 대신 랜딩으로 보낸다', async () => {
    getLatestBoardingPass.mockResolvedValueOnce(null)

    render(
      <AppProviders>
        <MemoryRouter>
          <ScanPage />
        </MemoryRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('발급된 보딩패스를 찾을 수 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('탑승권을 불러오는 중…')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '발급 페이지로 이동' })).toBeEnabled()
  })
})
