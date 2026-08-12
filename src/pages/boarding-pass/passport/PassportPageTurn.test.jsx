import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PassportPageTurn from './PassportPageTurn.jsx'

const rendererControl = vi.hoisted(() => ({
  fail: false,
  render: vi.fn(),
  domElement: null,
  disconnect: vi.fn(),
  cancelFrame: vi.fn(),
}))

vi.mock('three/addons/renderers/CSS3DRenderer.js', async (importOriginal) => {
  const actual = await importOriginal()

  class TestRenderer {
    constructor() {
      if (rendererControl.fail) throw new Error('renderer failed')
      this.domElement = document.createElement('div')
      rendererControl.domElement = this.domElement
    }

    setSize() {}

    render(scene, camera) {
      scene.traverse((object) => {
        if (object.element && !this.domElement.contains(object.element)) {
          this.domElement.append(object.element)
        }
      })
      rendererControl.render(scene, camera)
    }
  }

  return { ...actual, CSS3DRenderer: TestRenderer }
})

function TurnHarness({ disabled = false, initialStep = 0 }) {
  const [step, setStep] = useState(initialStep)

  return (
    <PassportPageTurn
      step={step}
      disabled={disabled}
      onCommit={(direction) => setStep((current) => current + direction)}
      renderStep={(visibleStep) => (
        <section data-passport-surface aria-label={`여권 ${visibleStep + 1}단계`}>
          Step {visibleStep + 1}
          {visibleStep === 1 ? <button type="button">상품 보기</button> : null}
        </section>
      )}
    />
  )
}

beforeEach(() => {
  rendererControl.fail = false
  rendererControl.render.mockReset()
  rendererControl.domElement = null
  rendererControl.disconnect.mockReset()
  rendererControl.cancelFrame.mockReset()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(() => callback(Date.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', rendererControl.cancelFrame)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect = rendererControl.disconnect
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal('CSS', { supports: () => true })
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PassportPageTurn', () => {
  it('다음 화살표 전환은 애니메이션 완료 후 다음 단계만 확정한다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByRole('button', { name: '다음 단계' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('settling 중 중복 클릭으로 다음 단계를 건너뛰지 않는다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const next = screen.getByRole('button', { name: '다음 단계' })

    fireEvent.click(next)
    fireEvent.click(next)
    await act(() => vi.advanceTimersByTimeAsync(500))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('renderer 초기화가 실패하면 즉시 fallback 전환한다', async () => {
    rendererControl.fail = true
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'fallback'),
    )

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('unmount 시 observer, animation frame과 renderer DOM을 정리한다', async () => {
    const { unmount } = render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const rendererDom = rendererControl.domElement

    unmount()

    expect(rendererControl.disconnect).toHaveBeenCalledTimes(1)
    expect(rendererControl.cancelFrame).toHaveBeenCalled()
    expect(rendererDom).not.toBeInTheDocument()
  })

  it('상품 CTA의 pointerDown은 page turn을 시작하지 않는다', async () => {
    render(<TurnHarness initialStep={1} />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    fireEvent.pointerDown(screen.getByRole('button', { name: '상품 보기' }))
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
  })
})
