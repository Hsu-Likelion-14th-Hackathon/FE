import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import IssueLoadingOverlay from './IssueLoadingOverlay.jsx'

describe('IssueLoadingOverlay', () => {
  afterEach(() => {
    document.documentElement.classList.remove('mcm-issue-loading')
  })

  it('마운트 동안 html에 동적 뷰포트 채움 클래스를 붙인다', () => {
    const { unmount } = render(<IssueLoadingOverlay />)

    expect(screen.getByRole('status', { name: '보딩패스 발급 중' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('mcm-issue-loading')

    unmount()
    expect(document.documentElement).not.toHaveClass('mcm-issue-loading')
  })
})
