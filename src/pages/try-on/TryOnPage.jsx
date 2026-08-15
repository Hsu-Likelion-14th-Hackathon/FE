import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import fittingSparkleIcon from '@/assets/icons/state/fitting-sparkle.svg'
import fittingSpinner from '@/assets/icons/state/fitting-spinner.png'
import closeIcon from '@/assets/icons/state/close.svg'
import creditDiamondIcon from '@/assets/icons/state/credit-diamond.svg'
import uploadArrowIcon from '@/assets/icons/state/upload-arrow.svg'
import {
  createFittingSession,
  createUploadUrl,
  getFittingSession,
  uploadToAzure,
} from '@/shared/api/fittingApi.js'
import { getPassport } from '@/shared/api/passportApi.js'
import { formatPrice, getProduct } from '@/shared/api/productApi.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './TryOnPage.module.scss'

const PROGRESS_STEP = 4
const PROGRESS_TICK_MS = 80
// 실제 완료(DONE)만 100을 채운다. 눈금이 먼저 끝나 버리면 "다 됐는데 안
// 넘어가는" 화면이 된다.
const PROGRESS_CEILING = 95
const POLL_INTERVAL_MS = 2000

function getPrefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = ({ matches }) => setPrefersReducedMotion(matches)

    mediaQuery.addEventListener?.('change', handleChange)

    return () => mediaQuery.removeEventListener?.('change', handleChange)
  }, [])

  return prefersReducedMotion
}

function UploadStage({
  credit,
  error,
  fileInputRef,
  fileName,
  onClose,
  onFileChange,
  onStartFitting,
  previewImage,
}) {
  return (
    <section
      className={`${styles.stage} ${styles.uploadStage}`}
      aria-label="AI Fitting 이미지 업로드"
    >
      <span className={styles.monogram} aria-hidden="true" />
      <button
        className={styles.closeButton}
        type="button"
        onClick={onClose}
        aria-label="상품 상세로 돌아가기"
      >
        <img src={closeIcon} alt="" />
      </button>

      <div className={styles.credit}>
        <span>Credit&nbsp; | &nbsp;{credit ?? '—'}</span>
        <img src={creditDiamondIcon} alt="" />
      </div>

      <div className={styles.uploadContent}>
        <div className={styles.previewCard}>
          <span className={styles.cardPin} aria-hidden="true" />
          <div className={styles.productCrop}>
            {previewImage ? <img src={previewImage} alt="" /> : null}
          </div>
        </div>

        <p className={styles.uploadMessage}>
          <span>AI Fitting을 위한</span>
          <span>이미지 업로드를 진행해 주세요</span>
        </p>

        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept="image/*"
          aria-label="전신 이미지 파일"
          onChange={onFileChange}
        />
        <button
          className={styles.uploadButton}
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <span>Upload</span>
          <img src={uploadArrowIcon} alt="" />
        </button>
        <span className="sr-only" aria-live="polite">
          {fileName ? `${fileName} 이미지가 선택되었습니다.` : '선택된 이미지가 없습니다.'}
        </span>

        {error ? (
          <p className={styles.errorMessage} role="alert">
            {error.status === 401 ? (
              <>
                로그인이 필요합니다. <Link to="/login">로그인하기</Link>
              </>
            ) : (
              (error.message ?? 'AI Fitting 요청에 실패했습니다.')
            )}
          </p>
        ) : null}
      </div>

      <button className={styles.fittingButton} type="button" onClick={onStartFitting}>
        <span>Fitting</span>
        <img src={fittingSparkleIcon} alt="" />
      </button>
    </section>
  )
}

/** Figma (17-1) — 피팅이 끝난 뒤 결과와 상품 정보를 보여준다. */
function ResultStage({ session, onClose, onDetail, onBag }) {
  return (
    <section className={`${styles.stage} ${styles.resultStage}`} aria-label="AI Fitting 결과">
      <span className={styles.monogram} aria-hidden="true" />
      <button
        className={styles.closeButton}
        type="button"
        onClick={onClose}
        aria-label="다시 업로드하기"
      >
        <img src={closeIcon} alt="" />
      </button>

      <p className={styles.resultTitle}>지금, 당신에게 맞는 형태</p>

      <div className={styles.resultCard}>
        <span className={styles.resultPin} aria-hidden="true" />
        {session?.resultImageUrl ? (
          <img className={styles.resultImage} src={session.resultImageUrl} alt="AI Fitting 결과" />
        ) : null}
      </div>

      <div className={styles.productCard}>
        <div className={styles.productThumb}>
          {session?.thumbnailImageUrl ? <img src={session.thumbnailImageUrl} alt="" /> : null}
        </div>
        <div className={styles.productInfo}>
          <p className={styles.productName}>{session?.name ?? ''}</p>
          <p className={styles.productPrice}>{formatPrice(session?.price ?? 0)}</p>
        </div>
        <div className={styles.productActions}>
          <button type="button" onClick={onDetail}>
            상세정보
          </button>
          <button type="button" onClick={onBag}>
            쇼핑백 추가
          </button>
        </div>
      </div>

      <button className={styles.saveButton} type="button">
        이미지 저장
      </button>
    </section>
  )
}

function LoadingStage({ progress, onClose }) {
  return (
    <section className={`${styles.stage} ${styles.loadingStage}`} aria-label="AI Fitting 처리 중">
      <span className={styles.monogram} aria-hidden="true" />
      <button
        className={styles.closeButton}
        type="button"
        onClick={onClose}
        aria-label="AI Fitting 취소"
      >
        <img src={closeIcon} alt="" />
      </button>

      <p className={styles.loadingLabel}>
        Loading<span aria-hidden="true"> ...</span>
      </p>

      <img className={styles.spinner} src={fittingSpinner} alt="" />

      <p className={styles.loadingMessage}>
        <span>고객님을 위한</span>
        <span>
          최적의 <strong>Fit</strong>을 찾고 있습니다
        </span>
      </p>

      <div className={styles.progressGroup}>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="AI Fitting 진행률"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <span className={styles.progressValue} style={{ '--fitting-progress': `${progress}%` }} />
        </div>
        <div className={styles.progressLabels} aria-hidden="true">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        AI Fitting을 처리하고 있습니다.
      </span>
    </section>
  )
}

export function Component() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState('upload')
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [product, setProduct] = useState(null)
  const [credit, setCredit] = useState(null)
  // 세션이 화면의 진짜 상태다. 결과 화면은 진행률이 아니라 status가 DONE인
  // 것에서 파생된다 — 눈금은 장식이고, 완료는 서버만 안다.
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)

  // 미리보기 카드는 지금 보고 있는 상품·색을 보여줘야 한다. URL이 기준이다.
  useEffect(() => {
    const controller = new AbortController()
    getProduct(productId, { signal: controller.signal })
      .then((loaded) => {
        if (!controller.signal.aborted) setProduct(loaded)
      })
      .catch(() => {
        // 미리보기가 비는 것뿐이다. 피팅 요청은 색 id만 있으면 된다.
      })
    return () => controller.abort()
  }, [productId])

  // 잔액 표시는 장식이다. 여권이 없거나 실패해도 피팅 흐름을 막지 않는다.
  useEffect(() => {
    let cancelled = false
    getPassport()
      .then((passport) => {
        if (!cancelled) setCredit(passport.credit)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // 상세에서 고른 색이 쿼리로 온다. 없으면 대표색이다.
  const colors = product?.colors ?? []
  const colorParam = Number(searchParams.get('color'))
  const selectedColor =
    colors.find((color) => color.productColorId === colorParam) ??
    colors.find((color) => color.isDefault) ??
    colors[0] ??
    null
  const productColorId =
    Number.isInteger(colorParam) && colorParam > 0
      ? colorParam
      : (selectedColor?.productColorId ?? null)

  // 진행률 눈금. 서버가 끝냈다고 하기 전에는 천장 아래에서 긴다.
  useEffect(() => {
    if (phase !== 'loading' || prefersReducedMotion) return undefined

    const timer = window.setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = Math.min(currentProgress + PROGRESS_STEP, PROGRESS_CEILING)

        if (nextProgress === PROGRESS_CEILING) window.clearInterval(timer)

        return nextProgress
      })
    }, PROGRESS_TICK_MS)

    return () => window.clearInterval(timer)
  }, [phase, prefersReducedMotion])

  // 2초 간격 폴링. PENDING이면 세션을 갈아 끼우지 않는다 — 끼우면 이 effect가
  // 매번 다시 걸려 간격이 초기화된다.
  useEffect(() => {
    if (phase !== 'loading' || !session || session.status !== 'PENDING') return undefined

    const controller = new AbortController()
    const timer = window.setInterval(async () => {
      try {
        const next = await getFittingSession(session.fittingSessionId, {
          signal: controller.signal,
        })
        if (controller.signal.aborted || next.status === 'PENDING') return
        setSession(next)
        if (next.status === 'DONE') {
          setProgress(100)
        } else {
          // FAILED — 차감된 크레딧은 백엔드가 자동 환급한다.
          setPhase('upload')
          setProgress(0)
          setError(new Error('AI Fitting 생성에 실패했습니다. 차감된 크레딧은 돌려드립니다.'))
        }
      } catch (cause) {
        if (cause?.name === 'AbortError') return
        // 조회 한 번 실패로 끊지 않는다. 다음 눈금에 다시 물어본다.
        // 401만은 계속 물어봐도 소용없으므로 접는다.
        if (cause?.status === 401) {
          setPhase('upload')
          setProgress(0)
          setError(cause)
        }
      }
    }, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [phase, session])

  const startFitting = async () => {
    if (!productColorId) return

    setError(null)
    setSession(null)
    setProgress(prefersReducedMotion ? PROGRESS_CEILING : 0)
    setPhase('loading')

    try {
      // 파일이 없으면 fileKey를 빼고 보낸다 — 회원의 기본 전신 이미지를 쓴다.
      let fileKey
      if (file) {
        const grant = await createUploadUrl({
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
        })
        await uploadToAzure(grant.uploadUrl, file)
        fileKey = grant.fileKey
      }

      const created = await createFittingSession({ productColorId, fileKey })
      setSession(created)
      if (created.status === 'DONE') setProgress(100)
    } catch (cause) {
      setPhase('upload')
      setProgress(0)
      setError(cause)
    }
  }

  const resetFitting = () => {
    setProgress(0)
    setSession(null)
    setPhase('upload')
  }

  const closeUpload = () => {
    navigate(productId ? `/products/${encodeURIComponent(productId)}` : '/products')
  }

  const handleFileChange = ({ target }) => {
    setFile(target.files?.[0] ?? null)
  }

  const showResult = phase === 'loading' && session?.status === 'DONE'

  return (
    <div className={styles.page}>
      <StoreHeader />
      <h1 className="sr-only">상품 착용</h1>
      {/* 내용이 채워진 채로 새로 붙는 live region은 읽히지 않는 경우가 있다.
          처음부터 비워 두고 완료 시점에 문구만 채운다. */}
      <span className="sr-only" role="status">
        {showResult ? 'AI Fitting 결과가 준비되었습니다.' : ''}
      </span>

      {phase === 'upload' ? (
        <UploadStage
          credit={credit}
          error={error}
          fileInputRef={fileInputRef}
          fileName={file?.name ?? ''}
          onClose={closeUpload}
          onFileChange={handleFileChange}
          onStartFitting={startFitting}
          previewImage={selectedColor?.images?.[0] ?? null}
        />
      ) : null}
      {phase === 'loading' && !showResult ? (
        <LoadingStage progress={progress} onClose={resetFitting} />
      ) : null}
      {showResult ? (
        <ResultStage
          session={session}
          onClose={resetFitting}
          onDetail={() =>
            navigate(productId ? `/products/${encodeURIComponent(productId)}` : '/products')
          }
          onBag={() => navigate('/cart')}
        />
      ) : null}
    </div>
  )
}
