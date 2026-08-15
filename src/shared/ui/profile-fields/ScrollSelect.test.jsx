import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import ScrollSelect from './ScrollSelect.jsx'

const options = [
  { value: 2000, label: '2000년' },
  { value: 2001, label: '2001년' },
  { value: 2002, label: '2002년' },
]

/** 열림 상태를 밖에서 쥐는 컴포넌트라 실제 사용처처럼 감싸서 본다. */
function Harness({ initialOpen = false }) {
  const [open, setOpen] = useState(initialOpen)
  const [value, setValue] = useState(2001)

  return (
    <div>
      <ScrollSelect
        label="연도"
        placeholder="연도"
        value={value}
        options={options}
        onChange={setValue}
        isOpen={open}
        onOpenChange={setOpen}
      />
      <button type="button">바깥 버튼</button>
    </div>
  )
}

describe('ScrollSelect', () => {
  it('고른 값에서 열리고 누르면 그 값을 넘긴다', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: '연도' }))
    const list = screen.getByRole('listbox', { name: '연도' })
    expect(list).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2001년' })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('option', { name: '2002년' }))
    expect(screen.queryByRole('listbox', { name: '연도' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '연도' })).toHaveTextContent('2002년')
  })

  it('초점이 밖으로 나가면 목록을 닫는다', () => {
    // Tab으로 다음 칸에 가면 목록이 그 칸을 덮은 채 남아 있었다.
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: '연도' }))
    expect(screen.getByRole('listbox', { name: '연도' })).toBeInTheDocument()

    const outside = screen.getByRole('button', { name: '바깥 버튼' })
    fireEvent.focusOut(screen.getByRole('option', { name: '2001년' }), { relatedTarget: outside })

    expect(screen.queryByRole('listbox', { name: '연도' })).not.toBeInTheDocument()
  })

  it('목록 안에서 초점이 옮겨 다니는 동안에는 닫지 않는다', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: '연도' }))
    const next = screen.getByRole('option', { name: '2002년' })
    fireEvent.focusOut(screen.getByRole('option', { name: '2001년' }), { relatedTarget: next })

    expect(screen.getByRole('listbox', { name: '연도' })).toBeInTheDocument()
  })

  it('Escape로 목록을 닫는다', () => {
    // 시트까지 함께 닫히지 않는지는 여기서 못 본다. 시트는 열린 목록이 있으면
    // Escape를 흘려보내도록 열림 상태를 직접 쥐고 있고, 그 동작은
    // PassportPage.test가 확인한다.
    render(<Harness initialOpen />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('listbox', { name: '연도' })).not.toBeInTheDocument()
  })
})
