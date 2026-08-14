import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import fittingSparkleIcon from '@/assets/icons/state/fitting-sparkle.svg'
import fittingSpinner from '@/assets/icons/state/fitting-spinner.png'
import closeIcon from '@/assets/icons/state/close.svg'
import creditDiamondIcon from '@/assets/icons/state/credit-diamond.svg'
import uploadArrowIcon from '@/assets/icons/state/upload-arrow.svg'
import pinkBagImage from '@/assets/images/products/diamant-soft-pink.webp'
import { getProduct } from '@/shared/data/products.js'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'

import styles from './TryOnPage.module.scss'

const PROGRESS_STEP = 4
const PROGRESS_TICK_MS = 80

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

function UploadStage({ fileInputRef, fileName, onClose, onFileChange, onStartFitting }) {
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
        <span>Credit&nbsp; | &nbsp;100</span>
        <img src={creditDiamondIcon} alt="" />
      </div>

      <div className={styles.uploadContent}>
        <div className={styles.previewCard}>
          <span className={styles.cardPin} aria-hidden="true" />
          <div className={styles.productCrop}>
            <img src={pinkBagImage} alt="핑크 Diamant 가방" />
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
      </div>

      <button className={styles.fittingButton} type="button" onClick={onStartFitting}>
        <span>Fitting</span>
        <img src={fittingSparkleIcon} alt="" />
      </button>
    </section>
  )
}

/** Figma (17-1) — 피팅이 끝난 뒤 결과와 상품 정보를 보여준다. */
function ResultStage({ product, onClose, onDetail, onBag }) {
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

      {/* 로딩 화면이 먼저 사라져 완료 안내가 전달되지 않는다. 여기서 알린다. */}
      <p className={styles.resultTitle} role="status">
        지금, 당신에게 맞는 형태
      </p>

      {/* 실제 피팅 이미지는 AI 연동 뒤에 들어온다. 지금은 자리만 잡아 둔다. */}
      <div className={styles.resultCard} role="img" aria-label="AI Fitting 결과 이미지 자리">
        <span className={styles.resultPin} aria-hidden="true" />
      </div>

      <div className={styles.productCard}>
        <div className={styles.productThumb}>
          <img src={product?.image ?? pinkBagImage} alt="" />
        </div>
        <div className={styles.productInfo}>
          <p className={styles.productName}>{product?.name ?? 'Diamant 비세토스 3D 참'}</p>
          <p className={styles.productPrice}>{product?.price ?? '₩490,000'}</p>
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
  const isComplete = progress === 100

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
        {isComplete ? 'AI Fitting 준비가 완료되었습니다.' : 'AI Fitting을 처리하고 있습니다.'}
      </span>
    </section>
  )
}

export function Component() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  // 결과 화면은 별도 상태가 아니라 진행률에서 파생시킨다. 타이머로 넘기면
  // 화면을 벗어난 뒤에도 타이머가 남아 다른 곳까지 흔든다.
  const [phase, setPhase] = useState('upload')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  // 결과 카드는 지금 보고 있는 상품을 보여줘야 한다. URL이 기준이다.
  const product = productId ? getProduct(productId) : null
  // 설정이 도중에 켜져도 즉시 끝으로 간다. 상태로 두면 효과 안에서 값을 바꾸게 되고,
  // 그러면 렌더가 연쇄로 돈다.
  const shownProgress = prefersReducedMotion ? 100 : progress

  useEffect(() => {
    if (phase !== 'loading' || prefersReducedMotion) return undefined

    const timer = window.setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = Math.min(currentProgress + PROGRESS_STEP, 100)

        if (nextProgress === 100) window.clearInterval(timer)

        return nextProgress
      })
    }, PROGRESS_TICK_MS)

    return () => window.clearInterval(timer)
  }, [phase, prefersReducedMotion])

  const startFitting = () => {
    setProgress(prefersReducedMotion ? 100 : 0)
    setPhase('loading')
  }

  const resetFitting = () => {
    setProgress(0)
    setPhase('upload')
  }

  const closeUpload = () => {
    navigate(productId ? `/products/${encodeURIComponent(productId)}` : '/products')
  }

  const handleFileChange = ({ target }) => {
    setFileName(target.files?.[0]?.name ?? '')
  }

  return (
    <div className={styles.page}>
      <StoreHeader />
      <h1 className="sr-only">상품 착용</h1>

      {phase === 'upload' ? (
        <UploadStage
          fileInputRef={fileInputRef}
          fileName={fileName}
          onClose={closeUpload}
          onFileChange={handleFileChange}
          onStartFitting={startFitting}
        />
      ) : null}
      {phase === 'loading' && shownProgress < 100 ? (
        <LoadingStage progress={shownProgress} onClose={resetFitting} />
      ) : null}
      {phase === 'loading' && shownProgress >= 100 ? (
        <ResultStage
          product={product}
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
