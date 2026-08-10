import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import CreditToast from '@/features/boarding-pass/credit-toast/CreditToast.jsx'
import { useBagHandlers } from '@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx'
import ScanDepartLoadingOverlay from '@/features/boarding-pass/scan-loading/ScanDepartLoadingOverlay.jsx'
import { getCurrentBoardingPass, simulateScan } from '@/shared/api/boardingPassApi.js'
import backArrowIcon from '@/shared/assets/boarding-pass/icons/back-arrow.svg'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import checkCircleIcon from '@/shared/assets/boarding-pass/scan/check-circle.svg'
import pointScanIcon from '@/shared/assets/boarding-pass/scan/point-scan.svg'
import scanButtonIcon from '@/shared/assets/boarding-pass/scan/scan-button-icon.svg'
import scanFrameIcon from '@/shared/assets/boarding-pass/scan/scan-frame.svg'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'

import styles from './ScanPage.module.scss'

const TOAST_MS = 3000
const TOAST_EXIT_MS = 320

/**
 * 스캔 페이지 (35)~(40).
 * idle → POST scan → SUCCESS + CreditToast(버튼 상단, 3초 페이드) → 비행 이륙하기 → flight.
 */
function ScanPage() {
  const navigate = useNavigate()
  const bagHandlers = useBagHandlers()
  const [pass, setPass] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [scanning, setScanning] = useState(false)
  const [credit, setCredit] = useState(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastEntered, setToastEntered] = useState(false)
  const [toastExiting, setToastExiting] = useState(false)
  const toastClosingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    getCurrentBoardingPass()
      .then((data) => {
        if (!cancelled) setPass(data)
      })
      .catch(() => {
        if (!cancelled) setPass(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const closeCreditToast = useCallback(() => {
    if (toastClosingRef.current) return
    toastClosingRef.current = true
    setToastExiting(true)
    window.setTimeout(() => {
      setToastOpen(false)
      setToastEntered(false)
      setToastExiting(false)
      setCredit(null)
      toastClosingRef.current = false
    }, TOAST_EXIT_MS)
  }, [])

  useEffect(() => {
    if (!toastOpen || toastExiting) return undefined
    // 마운트 직후 In 클래스를 붙이면 transition이 스킵되므로 한 프레임 뒤에 올린다.
    // toastEntered 초기화는 open/close 핸들러에서 이미 수행한다.
    let raf2 = 0
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setToastEntered(true))
    })
    return () => {
      window.cancelAnimationFrame(raf1)
      window.cancelAnimationFrame(raf2)
    }
  }, [toastOpen, toastExiting])

  useEffect(() => {
    if (!toastOpen || toastExiting) return undefined
    const timer = window.setTimeout(() => closeCreditToast(), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [toastOpen, toastExiting, closeCreditToast])

  async function handleSimulateScan() {
    if (scanning || phase !== 'idle') return
    setScanning(true)
    try {
      const passId = pass?.boardingPassId || pass?.id
      const result = await simulateScan(passId)
      setPhase('success')
      toastClosingRef.current = false
      setCredit(result.credit)
      setToastExiting(false)
      setToastEntered(false)
      setToastOpen(true)
    } catch {
      // MSW 실패 시에도 UI 스모크를 막지 않음 — 재시도 가능
    } finally {
      setScanning(false)
    }
  }

  const handleDepartComplete = useCallback(() => {
    navigate('/boarding-pass/flight')
  }, [navigate])

  function handleDepart() {
    if (phase !== 'success') return
    setPhase('departing')
  }

  const isSuccess = phase === 'success' || phase === 'departing'
  const isDeparting = phase === 'departing'
  const showCreditToast = toastOpen && credit

  return (
    <div className={styles.page}>
      <BoardingPassChrome {...bagHandlers} />

      <main className={styles.main}>
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => navigate('/boarding-pass')}
          className={styles.back}
          disabled={isDeparting}
        >
          <img src={backArrowIcon} alt="" className={styles.backIcon} />
        </button>

        <div className={styles.ticketWrap}>
          {pass ? (
            <BoardingTicketCard pass={pass} size="md" />
          ) : (
            <div className={styles.ticketSkeleton}>탑승권을 불러오는 중…</div>
          )}
        </div>

        <div className={styles.status}>
          {isSuccess ? (
            <img src={checkCircleIcon} alt="" aria-hidden="true" className={styles.statusIcon} />
          ) : (
            <div className={styles.scanTarget} aria-hidden="true">
              <img src={scanFrameIcon} alt="" className={styles.scanFrame} />
              <img src={pointScanIcon} alt="" className={styles.pointScan} />
            </div>
          )}
          <p className={styles.statusTitle}>{isSuccess ? 'SUCCESS SCAN' : 'BOARDING PASS'}</p>
          <p className={styles.statusDesc}>
            {isSuccess
              ? 'QR 코드 스캔 완료 · 비행 준비를 마쳤습니다'
              : '매장 입구에서 QR 코드를 스캔해 주세요'}
          </p>
        </div>

        <div className={styles.footer}>
          <div className={styles.ctaCluster}>
            {showCreditToast ? (
              <div
                className={`${styles.creditToast} ${toastExiting ? styles.creditToastOut : ''} ${toastEntered && !toastExiting ? styles.creditToastIn : ''}`}
                role="status"
              >
                <button
                  type="button"
                  aria-label="토스트 닫기"
                  onClick={closeCreditToast}
                  className={styles.creditToastClose}
                >
                  <img src={closeIcon} alt="" className={styles.creditToastCloseIcon} />
                </button>
                <CreditToast credit={credit} />
              </div>
            ) : null}

            {isSuccess ? (
              <button
                type="button"
                onClick={handleDepart}
                disabled={isDeparting}
                className={styles.cta}
              >
                비행 이륙하기
              </button>
            ) : (
              <button
                type="button"
                disabled={scanning || !pass}
                onClick={handleSimulateScan}
                className={styles.cta}
              >
                <img src={scanButtonIcon} alt="" aria-hidden="true" className={styles.ctaIcon} />
                {scanning ? '스캔 중…' : '평가용 탑승권 스캔 시뮬레이션'}
              </button>
            )}
          </div>
        </div>
      </main>

      {isDeparting ? <ScanDepartLoadingOverlay onComplete={handleDepartComplete} /> : null}
    </div>
  )
}

export default ScanPage
