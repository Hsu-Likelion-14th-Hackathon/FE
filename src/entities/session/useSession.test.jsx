import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAccessToken, setAccessToken } from '@/shared/api/authToken.js'
import { isProfilePending, setProfilePending } from '@/shared/api/profilePending.js'

const getMe = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/authApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getMe: (...args) => getMe(...args),
}))

import { useSession } from './useSession.js'

function SessionProbe() {
  const { status } = useSession()
  return <p>status: {status}</p>
}

beforeEach(() => {
  getMe.mockReset()
  setProfilePending(false)
})
afterEach(() => {
  clearAccessToken()
  setProfilePending(false)
})

describe('useSession', () => {
  it('세션 복원에서 이름이 비어 있으면 미완성 표시를 켠다', async () => {
    // 미완성 표시는 sessionStorage라 탭을 닫으면 사라지고, 카카오 재로그인의
    // isNewUser는 유저 행 기준이라 프로필 미입력 이탈자를 못 잡을 수 있다.
    // 서버가 준 실제 프로필이 마지막 그물이다.
    getMe.mockResolvedValue({ name: '', nationality: '', birthDate: '' })
    setAccessToken('restored-token')
    render(<SessionProbe />)

    await screen.findByText('status: authenticated')
    expect(isProfilePending()).toBe(true)
  })

  it('세션 복원에서 이름이 있으면 미완성 표시를 끈다', async () => {
    // 프로필이 있는 계정에 표시가 남아 있으면 멀쩡한 회원이 가입 화면에 갇힌다.
    getMe.mockResolvedValue({ name: 'YEONJU LIM', nationality: 'KR', birthDate: '2000 01 01' })
    setProfilePending(true)
    setAccessToken('restored-token')
    render(<SessionProbe />)

    await screen.findByText('status: authenticated')
    expect(isProfilePending()).toBe(false)
  })

  it('회원 확인이 실패하면 미완성 표시를 건드리지 않는다', async () => {
    // 네트워크가 끊긴 것뿐일 수 있다. 모르는 상태로 표시를 바꾸면 안 된다.
    getMe.mockRejectedValue(new Error('network down'))
    setProfilePending(true)
    setAccessToken('restored-token')
    render(<SessionProbe />)

    await screen.findByText('status: guest')
    expect(isProfilePending()).toBe(true)
  })
})
