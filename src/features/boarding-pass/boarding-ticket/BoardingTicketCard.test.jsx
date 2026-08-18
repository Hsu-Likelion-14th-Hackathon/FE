import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// QR 라이브러리는 값을 화면에 드러내지 않는다. 값 검증을 위해 대역으로 바꾼다.
vi.mock('react-qr-code', () => ({
  default: ({ value }) => <span data-testid="qr-value">{value}</span>,
}))

import BoardingTicketCard from './BoardingTicketCard.jsx'

describe('BoardingTicketCard', () => {
  it('QR은 히든 이벤트 페이지로 잇고 패스 코드를 쿼리로 싣는다', () => {
    // 찍는 사람은 앱 사용자가 아니라 티켓을 받아 든 손님이다.
    render(<BoardingTicketCard pass={{ passCode: 'MCM-A1B2C3D4' }} />)

    expect(screen.getByTestId('qr-value')).toHaveTextContent(
      'https://khy1121.github.io/HACKATHON_FE_EVENT/?pass=MCM-A1B2C3D4',
    )
  })

  it('패스 코드가 없으면 QR을 그리지 않는다', () => {
    render(<BoardingTicketCard pass={{ passengerName: 'HYKIM' }} />)

    expect(screen.queryByTestId('qr-value')).not.toBeInTheDocument()
  })
})
