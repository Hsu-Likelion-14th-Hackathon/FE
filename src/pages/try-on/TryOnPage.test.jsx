import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppProviders from '@/app/providers.jsx'

const getProduct = vi.hoisted(() => vi.fn())
const getPassport = vi.hoisted(() => vi.fn())
const createUploadUrl = vi.hoisted(() => vi.fn())
const uploadToAzure = vi.hoisted(() => vi.fn())
const createFittingSession = vi.hoisted(() => vi.fn())
const getFittingSession = vi.hoisted(() => vi.fn())
const getMe = vi.hoisted(() => vi.fn())
const registerBodyImage = vi.hoisted(() => vi.fn())
const deleteBodyImage = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/authApi.js', () => ({
  getMe: (...args) => getMe(...args),
  registerBodyImage: (...args) => registerBodyImage(...args),
  deleteBodyImage: (...args) => deleteBodyImage(...args),
}))

vi.mock('@/shared/api/productApi.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getProduct: (...args) => getProduct(...args),
}))

vi.mock('@/shared/api/passportApi.js', () => ({
  getPassport: (...args) => getPassport(...args),
}))

vi.mock('@/shared/api/fittingApi.js', () => ({
  createUploadUrl: (...args) => createUploadUrl(...args),
  uploadToAzure: (...args) => uploadToAzure(...args),
  createFittingSession: (...args) => createFittingSession(...args),
  getFittingSession: (...args) => getFittingSession(...args),
}))

import { Component } from './TryOnPage.jsx'

const product = {
  id: 1,
  name: 'Diamant 비세토스 3D 참',
  price: 490000,
  priceLabel: '₩490,000',
  description: '',
  colors: [
    {
      productColorId: 1,
      label: 'Soft Pink',
      hex: '#F4BFC5',
      isDefault: true,
      images: ['https://cdn/soft-pink.jpg'],
      sizes: [],
      isWished: false,
    },
    {
      productColorId: 2,
      label: 'Cinnamon',
      hex: '#7E3F47',
      isDefault: false,
      images: ['https://cdn/cinnamon.jpg'],
      sizes: [],
      isWished: false,
    },
  ],
}

const pendingSession = {
  fittingSessionId: 11,
  status: 'PENDING',
  resultImageUrl: null,
  creditCost: 50,
  productColorId: 1,
  productId: 1,
  name: 'Diamant 비세토스 3D 참',
  price: 490000,
  thumbnailImageUrl: 'https://cdn/soft-pink.jpg',
}

const doneSession = {
  ...pendingSession,
  status: 'DONE',
  resultImageUrl: 'https://cdn/fitting-result.jpg',
}

function renderTryOn(path = '/products/1/try-on') {
  render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/products/:productId/try-on" element={<Component />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

beforeEach(() => {
  getProduct.mockReset().mockResolvedValue(product)
  getPassport.mockReset().mockResolvedValue({ credit: 150 })
  createUploadUrl.mockReset().mockResolvedValue({
    uploadUrl: 'https://blob/up?sas=1',
    fileKey: 'uploads/me.jpg',
    expiresIn: 300,
  })
  uploadToAzure.mockReset().mockResolvedValue(undefined)
  createFittingSession.mockReset().mockResolvedValue(pendingSession)
  getFittingSession.mockReset().mockResolvedValue(doneSession)
  getMe.mockReset().mockResolvedValue({ defaultBodyImageUrl: null })
  registerBodyImage.mockReset().mockResolvedValue({ bodyImageUrl: 'https://cdn/body.jpg' })
  deleteBodyImage.mockReset().mockResolvedValue({ deleted: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TryOnPage', () => {
  it('업로드 상태에 여권의 크레딧 잔액과 상품 미리보기를 보여 준다', async () => {
    renderTryOn()

    expect(screen.getByRole('heading', { name: '상품 착용' })).toBeInTheDocument()
    expect(await screen.findByText('Credit | 150')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fitting' })).toBeInTheDocument()
    // 대표색 사진이 미리보기에 앉는다.
    await waitFor(() =>
      expect(document.querySelector('[class*=productCrop] img')).toHaveAttribute(
        'src',
        'https://cdn/soft-pink.jpg',
      ),
    )
  })

  it('파일 없이 Fitting을 누르면 fileKey 없이 대표색으로 세션을 만든다', async () => {
    renderTryOn()
    await screen.findByText('Credit | 150')

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await waitFor(() => expect(createFittingSession).toHaveBeenCalled())

    // 기본 전신 이미지를 쓰는 경로 — 업로드 API는 부르지 않는다.
    expect(createUploadUrl).not.toHaveBeenCalled()
    expect(createFittingSession).toHaveBeenCalledWith({ productColorId: 1, fileKey: undefined })
  })

  it('쿼리의 색을 세션에 싣는다', async () => {
    renderTryOn('/products/1/try-on?color=2')
    await screen.findByText('Credit | 150')

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await waitFor(() => expect(createFittingSession).toHaveBeenCalled())

    expect(createFittingSession).toHaveBeenCalledWith({ productColorId: 2, fileKey: undefined })
  })

  it('파일을 고르면 업로드 URL 발급 → Azure 업로드 → fileKey로 세션을 만든다', async () => {
    renderTryOn()
    await screen.findByText('Credit | 150')

    const file = new File(['photo-bytes'], 'me.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('전신 이미지 파일'), { target: { files: [file] } })
    expect(screen.getByText('me.jpg 이미지가 선택되었습니다.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await waitFor(() => expect(createFittingSession).toHaveBeenCalled())

    expect(createUploadUrl).toHaveBeenCalledWith({ fileName: 'me.jpg', contentType: 'image/jpeg' })
    expect(uploadToAzure).toHaveBeenCalledWith('https://blob/up?sas=1', file)
    expect(createFittingSession).toHaveBeenCalledWith({
      productColorId: 1,
      fileKey: 'uploads/me.jpg',
    })
  })

  it('등록된 기본 전신 이미지가 있으면 안내와 삭제 버튼을 보여 준다', async () => {
    getMe.mockResolvedValue({ defaultBodyImageUrl: 'https://cdn/default-body.jpg' })
    renderTryOn()

    expect(
      await screen.findByText('사진을 고르지 않으면 등록된 기본 전신 이미지를 사용해요'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(deleteBodyImage).toHaveBeenCalled())
    expect(
      screen.queryByText('사진을 고르지 않으면 등록된 기본 전신 이미지를 사용해요'),
    ).not.toBeInTheDocument()
  })

  it('저장을 체크하고 Fitting하면 업로드한 fileKey로 기본 이미지도 등록한다', async () => {
    renderTryOn()
    await screen.findByText('Credit | 150')

    const file = new File(['photo-bytes'], 'me.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('전신 이미지 파일'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('checkbox', { name: '이 사진을 기본 전신 이미지로 저장' }))

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await waitFor(() => expect(createFittingSession).toHaveBeenCalled())

    // 업로드는 한 번뿐 — 피팅에 쓴 fileKey를 그대로 재사용한다.
    expect(registerBodyImage).toHaveBeenCalledWith('uploads/me.jpg')
  })

  it('저장을 체크하지 않으면 기본 이미지를 등록하지 않는다', async () => {
    renderTryOn()
    await screen.findByText('Credit | 150')

    const file = new File(['photo-bytes'], 'me.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('전신 이미지 파일'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await waitFor(() => expect(createFittingSession).toHaveBeenCalled())

    expect(registerBodyImage).not.toHaveBeenCalled()
  })

  /** 결과 화면까지 간다 — 세션이 곧바로 DONE으로 끝나는 경로. */
  async function reachResultStage() {
    createFittingSession.mockResolvedValue(doneSession)
    renderTryOn()
    await screen.findByText('Credit | 150')
    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    return await screen.findByRole('button', { name: '이미지 저장' })
  }

  it('이미지 저장 — 공유 시트를 지원하면 파일로 넘긴다 (모바일)', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.canShare = vi.fn(() => true)
    navigator.share = share
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['img-bytes'], { type: 'image/png' }),
      }),
    )

    try {
      fireEvent.click(await reachResultStage())

      await waitFor(() => expect(share).toHaveBeenCalled())
      const shared = share.mock.calls[0][0].files[0]
      expect(shared.name).toBe('mcm-fitting-11.png')
    } finally {
      vi.unstubAllGlobals()
      delete navigator.canShare
      delete navigator.share
    }
  })

  it('이미지 저장 — 공유가 없으면 Blob 다운로드로 내려받는다 (데스크톱)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['img-bytes'], { type: 'image/jpeg' }),
      }),
    )
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    try {
      fireEvent.click(await reachResultStage())

      await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock'))
      expect(createObjectURL).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
      delete URL.createObjectURL
      delete URL.revokeObjectURL
    }
  })

  it('이미지 저장 — fetch가 막히면(CORS) 새 탭으로 열고 안내한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const open = vi.fn()
    vi.stubGlobal('open', open)

    try {
      fireEvent.click(await reachResultStage())

      await waitFor(() =>
        expect(open).toHaveBeenCalledWith('https://cdn/fitting-result.jpg', '_blank', 'noopener'),
      )
      expect(
        await screen.findByText('새 탭에서 이미지를 길게 눌러 저장해 주세요.'),
      ).toBeInTheDocument()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('PENDING 동안 로딩을 보여주고, 폴링이 DONE을 받으면 결과 화면으로 넘어간다', async () => {
    vi.useFakeTimers()
    renderTryOn()
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await act(async () => {})

    expect(screen.getByRole('region', { name: 'AI Fitting 처리 중' })).toBeInTheDocument()
    expect(getFittingSession).not.toHaveBeenCalled()

    // 2초 눈금마다 조회한다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(getFittingSession).toHaveBeenCalledWith(11, expect.anything())
    const result = screen.getByRole('region', { name: 'AI Fitting 결과' })
    expect(result).toHaveTextContent('Diamant 비세토스 3D 참')
    expect(result).toHaveTextContent('₩490,000')
    expect(screen.getByRole('img', { name: 'AI Fitting 결과' })).toHaveAttribute(
      'src',
      'https://cdn/fitting-result.jpg',
    )
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('진행률 눈금은 서버가 끝내기 전 천장(95) 아래에서 긴다', async () => {
    vi.useFakeTimers()
    getFittingSession.mockResolvedValue(pendingSession)
    renderTryOn()
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await act(async () => {})

    const progressbar = screen.getByRole('progressbar', { name: 'AI Fitting 진행률' })
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(80 * 40)
    })
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
    expect(Number(progressbar.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(95)
    expect(screen.getByRole('region', { name: 'AI Fitting 처리 중' })).toBeInTheDocument()
  })

  it('FAILED로 끝나면 업로드 화면으로 돌아와 환급 안내를 보여 준다', async () => {
    vi.useFakeTimers()
    getFittingSession.mockResolvedValue({ ...pendingSession, status: 'FAILED' })
    renderTryOn()
    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))
    await act(async () => {})
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(screen.getByRole('region', { name: 'AI Fitting 이미지 업로드' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'AI Fitting 생성에 실패했습니다. 차감된 크레딧은 돌려드립니다.',
    )
  })

  it('크레딧이 부족하면 백엔드 안내를 그대로 보여 준다', async () => {
    createFittingSession.mockRejectedValue(
      Object.assign(new Error('크레딧이 부족합니다. 매장 방문 시 충전됩니다.'), {
        status: 400,
        code: 'INSUFFICIENT_CREDIT',
      }),
    )
    renderTryOn()
    await screen.findByText('Credit | 150')

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '크레딧이 부족합니다. 매장 방문 시 충전됩니다.',
    )
    expect(screen.getByRole('region', { name: 'AI Fitting 이미지 업로드' })).toBeInTheDocument()
  })

  it('처리 중 화면에서도 모노그램이 어둠막 위에 남는다', async () => {
    renderTryOn()
    await screen.findByText('Credit | 150')

    fireEvent.click(screen.getByRole('button', { name: 'Fitting' }))

    const stage = screen.getByRole('region', { name: 'AI Fitting 처리 중' })
    const monogram = stage.querySelector('[class*=monogram]')
    // 어둠막(::before)과 같은 층에 있어야 트리 순서로 그 위에 얹힌다. 0으로
    // 내려가면 60% 어둠막 아래로 깔려 로딩 화면에서 무늬가 사라진다.
    expect(window.getComputedStyle(monogram).zIndex).toBe('1')
    // 무늬는 어둠막보다 뒤에 와야 한다. 앞에 두면 다시 묻힌다.
    expect(monogram).toBe(stage.firstElementChild)
  })
})
