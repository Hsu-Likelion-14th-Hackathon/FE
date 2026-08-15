import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PassNoticeToast from './PassNoticeToast.jsx'

describe('PassNoticeToast', () => {
  it('아이콘·제목·안내 문구를 같은 레이아웃으로 보여 준다', () => {
    render(<PassNoticeToast icon="/icon.svg" title="제목" note="안내" />)

    expect(screen.getByText('제목')).toBeInTheDocument()
    expect(screen.getByText('안내')).toBeInTheDocument()
    expect(document.querySelector('img')).toHaveAttribute('src', '/icon.svg')
  })
})
