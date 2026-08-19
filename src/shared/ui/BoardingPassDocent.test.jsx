import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BoardingPassDocent from './BoardingPassDocent.jsx'

/** jsdom의 Audio는 play를 구현하지 않는다. 만들어진 인스턴스를 추적하는 대역. */
class FakeAudio {
  constructor(src) {
    this.src = src
    this.preload = ''
    this.currentTime = 0
    this.paused = true
    this.listeners = {}
    FakeAudio.instances.push(this)
  }

  play() {
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  addEventListener(type, fn) {
    this.listeners[type] = fn
  }

  removeEventListener(type) {
    delete this.listeners[type]
  }
}

beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
})
afterEach(() => vi.unstubAllGlobals())

describe('BoardingPassDocent', () => {
  it('재생을 누르면 틀고, 한 번 더 누르면 그 지점에서 멈췄다 이어 튼다', () => {
    render(<BoardingPassDocent audioUrl="https://cdn/floor-journey.mp3" />)

    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))
    const [audio] = FakeAudio.instances
    expect(audio.src).toBe('https://cdn/floor-journey.mp3')
    expect(audio.paused).toBe(false)

    // 일시정지 — 지점(currentTime)은 그대로 남는다.
    audio.currentTime = 12
    fireEvent.click(screen.getByRole('button', { name: '도슨트 일시정지' }))
    expect(audio.paused).toBe(true)
    expect(audio.currentTime).toBe(12)

    // 다시 누르면 그 지점부터 이어 튼다.
    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))
    expect(audio.paused).toBe(false)
    expect(audio.currentTime).toBe(12)
  })

  it('네모 버튼은 처음부터 다시 틀고, 음성이 끝나면 스스로 정지 상태가 된다', () => {
    render(<BoardingPassDocent audioUrl="https://cdn/floor-journey.mp3" />)
    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))
    const [audio] = FakeAudio.instances
    audio.currentTime = 30

    fireEvent.click(screen.getByRole('button', { name: '도슨트 처음부터 재생' }))
    expect(audio.currentTime).toBe(0)
    expect(audio.paused).toBe(false)

    act(() => audio.listeners.ended?.())
    expect(screen.getByRole('button', { name: '도슨트 재생' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('층이 바뀌면 이전 층 해설을 멈추고 갈아끼운다', () => {
    // 남겨 두면 두 층의 음성이 겹친다.
    const { rerender } = render(<BoardingPassDocent audioUrl="https://cdn/floor-journey.mp3" />)
    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))

    rerender(<BoardingPassDocent audioUrl="https://cdn/floor-emblem.mp3" />)

    const [first, second] = FakeAudio.instances
    expect(first.paused).toBe(true)
    expect(second.src).toBe('https://cdn/floor-emblem.mp3')
    // 새 층에서는 정지 상태부터 시작한다.
    expect(screen.getByRole('button', { name: '도슨트 재생' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('배속 버튼은 1 → 1.25 → 1.5 → 2를 돌고 재생 중에도 바로 반영된다', () => {
    render(<BoardingPassDocent audioUrl="https://cdn/floor-journey.mp3" />)
    const rateButton = screen.getByRole('button', { name: /재생 속도/ })

    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))
    const [audio] = FakeAudio.instances
    expect(audio.playbackRate ?? 1).toBe(1)

    fireEvent.click(rateButton)
    expect(audio.playbackRate).toBe(1.25)
    expect(rateButton).toHaveTextContent('1.25x')

    fireEvent.click(rateButton)
    fireEvent.click(rateButton)
    expect(audio.playbackRate).toBe(2)

    // 한 바퀴 돌면 처음으로.
    fireEvent.click(rateButton)
    expect(audio.playbackRate).toBe(1)
  })

  it('층이 바뀌어도 배속은 유지된다', () => {
    // 듣는 속도는 층이 아니라 사람의 취향이다.
    const { rerender } = render(<BoardingPassDocent audioUrl="https://cdn/floor-journey.mp3" />)
    fireEvent.click(screen.getByRole('button', { name: /재생 속도/ }))

    rerender(<BoardingPassDocent audioUrl="https://cdn/floor-emblem.mp3" />)
    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))

    const second = FakeAudio.instances[1]
    expect(second.playbackRate).toBe(1.25)
  })

  it('audioUrl이 없으면 눌러도 소리 없이 상태 표시만 한다', () => {
    render(<BoardingPassDocent />)

    fireEvent.click(screen.getByRole('button', { name: '도슨트 재생' }))

    expect(FakeAudio.instances).toHaveLength(0)
    expect(screen.getByRole('button', { name: '도슨트 일시정지' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
