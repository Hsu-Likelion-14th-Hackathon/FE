import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PassportPageTurn from './PassportPageTurn.jsx'

const rendererControl = vi.hoisted(() => ({
  fail: false,
  render: vi.fn(),
  setSize: vi.fn(),
  setFaces: vi.fn(),
  dispose: vi.fn(),
  cancelFrame: vi.fn(),
  canvas: null,
}))

// WebGL은 jsdom에 없으므로 종이 렌더러를 통째로 대역으로 바꾼다.
vi.mock('./passportBookScene.js', () => ({
  createPassportBook: () => {
    if (rendererControl.fail) throw new Error('renderer failed')
    const canvas = document.createElement('canvas')
    rendererControl.canvas = canvas
    return {
      canvas,
      setSize: rendererControl.setSize,
      setPages: rendererControl.setFaces,
      setTurn: rendererControl.render,
      render: rendererControl.render,
      dispose: rendererControl.dispose,
    }
  },
}))

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

function setSurfaceRect(width = 400) {
  const surface = screen.getByTestId('passport-turn-surface')
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 394,
    width,
    height: 394,
    toJSON() {},
  })
  return surface
}

async function finishAnimation(duration) {
  await act(() => vi.advanceTimersByTimeAsync(duration))
}

beforeEach(() => {
  localStorage.clear()
  rendererControl.fail = false
  rendererControl.render.mockReset()
  rendererControl.setSize.mockReset()
  rendererControl.setFaces.mockReset()
  rendererControl.dispose.mockReset()
  rendererControl.cancelFrame.mockReset()
  rendererControl.canvas = null
  // rAF는 아래에서 직접 stub 하므로 fake timer가 가로채지 않게 제외한다.
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
  })
  vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(() => callback(Date.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (frame) => {
    rendererControl.cancelFrame(frame)
    clearTimeout(frame)
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        rendererControl.resize = callback
      }
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
  it('첫 portal 측정이 surface mount보다 빨라도 첫 여권 면을 노출한다', async () => {
    const querySelector = Element.prototype.querySelector
    let surfaceQueries = 0
    vi.spyOn(Element.prototype, 'querySelector').mockImplementation(function (selector) {
      if (selector === '[data-passport-surface]' && surfaceQueries++ === 0) return null
      return querySelector.call(this, selector)
    })
    render(<TurnHarness />)

    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    // 캔버스가 그림을 맡으므로 DOM은 투명하지만 접근성 트리에는 남아 있어야 한다.
    expect(screen.getByRole('region', { name: '여권 1단계' })).toBeInTheDocument()
  })

  it('여권 폭의 25%를 넘긴 왼쪽 스와이프로 다음 단계에 이동한다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 1,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 190, clientY: 104 })
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'dragging')
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 190, clientY: 104 })
    await finishAnimation(900)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('25% 미만의 느린 스와이프는 220ms 안에 원래 단계로 복귀한다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 2,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    await act(() => vi.advanceTimersByTimeAsync(300))
    fireEvent.pointerMove(surface, { pointerId: 2, clientX: 240, clientY: 102 })
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'dragging')
    fireEvent.pointerUp(surface, { pointerId: 2, clientX: 240, clientY: 102 })
    await finishAnimation(240)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle'),
    )
  })

  it('오른쪽 스와이프로 이전 단계에 이동한다', async () => {
    render(<TurnHarness initialStep={1} />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 3,
      button: 0,
      isPrimary: true,
      clientX: 100,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 3, clientX: 210, clientY: 104 })
    fireEvent.pointerUp(surface, { pointerId: 3, clientX: 210, clientY: 104 })
    await finishAnimation(900)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('25% 미만이어도 빠른 스와이프면 다음 단계에 이동한다', async () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(40)
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 4,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 4, clientX: 270, clientY: 100 })
    fireEvent.pointerUp(surface, { pointerId: 4, clientX: 270, clientY: 100 })
    await finishAnimation(900)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('수직 제스처는 page turn을 시작하지 않고 브라우저 스크롤에 남긴다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 5,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 5, clientX: 290, clientY: 150 })
    fireEvent.pointerUp(surface, { pointerId: 5, clientX: 290, clientY: 150 })

    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('pointer cancel은 220ms 안에 현재 단계로 복귀한다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 6,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 6, clientX: 160, clientY: 100 })
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'dragging')
    fireEvent.pointerCancel(surface, { pointerId: 6 })
    await finishAnimation(240)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
  })

  it('drag 중 disabled로 바뀌면 release를 cancel로 정리한다', async () => {
    const { rerender } = render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 11,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 11, clientX: 160, clientY: 100 })
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'dragging')

    rerender(<TurnHarness disabled />)
    fireEvent.pointerUp(surface, { pointerId: 11, clientX: 160, clientY: 100 })
    await finishAnimation(240)

    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument()
  })

  it('pointer capture를 잃으면 cancel 후 새 swipe를 받을 수 있다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 12,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 12, clientX: 160, clientY: 100 })
    fireEvent.lostPointerCapture(surface, { pointerId: 12 })
    await finishAnimation(240)

    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument()

    fireEvent.pointerDown(surface, {
      pointerId: 13,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 13, clientX: 190, clientY: 100 })
    fireEvent.pointerUp(surface, { pointerId: 13, clientX: 190, clientY: 100 })
    await finishAnimation(900)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('방향 잠금 뒤 시작점에서 release해도 dragging을 종료한다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 10,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 10, clientX: 260, clientY: 100 })
    fireEvent.pointerMove(surface, { pointerId: 10, clientX: 300, clientY: 100 })
    fireEvent.pointerUp(surface, { pointerId: 10, clientX: 300, clientY: 100 })
    await finishAnimation(240)

    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('reduced motion의 스와이프는 release 직후 commit하고 RAF를 예약하지 않는다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const requestFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'fallback'),
    )
    const surface = setSurfaceRect()

    fireEvent.pointerDown(surface, {
      pointerId: 7,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 7, clientX: 180, clientY: 100 })
    fireEvent.pointerUp(surface, { pointerId: 7, clientX: 180, clientY: 100 })

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
    expect(requestFrame).not.toHaveBeenCalled()
  })

  it('종이 렌더러를 못 만들면 fallback으로 즉시 한 단계만 이동한다', async () => {
    rendererControl.fail = true
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'fallback'),
    )

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('disabled이면 화살표와 pointer 입력을 모두 무시한다', async () => {
    render(<TurnHarness disabled />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    const surface = setSurfaceRect()

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    fireEvent.pointerDown(surface, {
      pointerId: 8,
      button: 0,
      isPrimary: true,
      clientX: 300,
      clientY: 100,
    })
    fireEvent.pointerMove(surface, { pointerId: 8, clientX: 180, clientY: 100 })
    fireEvent.pointerUp(surface, { pointerId: 8, clientX: 180, clientY: 100 })

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
  })

  it.each([
    [0, '이전 단계', 100, 210, '25'],
    [3, '다음 단계', 300, 190, '100'],
  ])(
    '%i단계 경계는 불가능한 화살표와 pointer 방향을 막는다',
    async (initialStep, buttonName, startX, endX, progress) => {
      render(<TurnHarness initialStep={initialStep} />)
      await waitFor(() =>
        expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
      )
      const surface = setSurfaceRect()

      expect(screen.getByRole('button', { name: buttonName })).toBeDisabled()
      fireEvent.pointerDown(surface, {
        pointerId: 9,
        button: 0,
        isPrimary: true,
        clientX: startX,
        clientY: 100,
      })
      fireEvent.pointerMove(surface, { pointerId: 9, clientX: endX, clientY: 100 })
      fireEvent.pointerUp(surface, { pointerId: 9, clientX: endX, clientY: 100 })

      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', progress)
    },
  )

  it('전환 중에도 접근성 트리에는 현재 단계만 남는다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    // 넘어가는 종이는 캔버스가 그리므로 다음 단계 DOM이 미리 생기지 않는다.
    expect(screen.getByRole('region', { name: '여권 1단계' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여권 2단계' })).not.toBeInTheDocument()
    // 초기 정지 화면 1회 + 넘김 시작 1회
    expect(rendererControl.setFaces).toHaveBeenCalledTimes(2)
    await finishAnimation(900)

    expect(screen.getByRole('region', { name: '여권 2단계' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '여권 1단계' })).not.toBeInTheDocument()
  })

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

    await act(() => vi.advanceTimersByTimeAsync(900))
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
    await act(() => vi.advanceTimersByTimeAsync(900))

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

  it('reduced motion이면 화살표 단계가 즉시 이동한다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<TurnHarness />)

    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'fallback'),
    )
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it.each([
    ['CSS 전역이 없을 때', undefined],
    ['CSS.supports가 없을 때', {}],
  ])('%s fallback으로 전환한다', async (_, css) => {
    vi.stubGlobal('CSS', css)
    render(<TurnHarness />)

    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'fallback'),
    )
  })

  it('백그라운드 탭에서는 애니메이션 없이 단계를 확정한다', async () => {
    // rAF가 멈추는 백그라운드에서 전환이 시작되면 상태가 고착될 수 있다.
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('unmount 시 animation frame과 렌더러 자원을 정리한다', async () => {
    const { unmount } = render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )
    fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
    const canvas = rendererControl.canvas

    unmount()

    expect(rendererControl.cancelFrame).toHaveBeenCalled()
    expect(rendererControl.dispose).toHaveBeenCalledTimes(1)
    expect(canvas).not.toBeInTheDocument()
  })

  it('상품 CTA의 pointerDown은 page turn을 시작하지 않는다', async () => {
    render(<TurnHarness initialStep={1} />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    fireEvent.pointerDown(screen.getByRole('button', { name: '상품 보기' }))
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
  })

  it('모바일 슬라이드 힌트는 처음 한 번만 보여준다', async () => {
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    const hint = screen.getByText('옆으로 슬라이드 해보세요')
    expect(hint).toBeInTheDocument()

    // 손을 대는 순간 방법을 안 것이므로 힌트가 물러난다.
    fireEvent.pointerDown(screen.getByTestId('passport-turn-surface'), {
      pointerId: 1,
      clientX: 200,
      clientY: 200,
    })
    expect(screen.queryByText('옆으로 슬라이드 해보세요')).not.toBeInTheDocument()
  })

  it('한 번 넘겨 본 뒤에는 힌트를 다시 띄우지 않는다', async () => {
    localStorage.setItem('mcm-passport-swipe-hint-seen', '1')
    render(<TurnHarness />)
    await waitFor(() =>
      expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
    )

    expect(screen.queryByText('옆으로 슬라이드 해보세요')).not.toBeInTheDocument()
  })
})
