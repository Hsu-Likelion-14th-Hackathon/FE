import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import BoardingTicketCard from '@/features/boarding-pass/boarding-ticket/BoardingTicketCard.jsx'
import { PASS_STORAGE_KEY } from '@/features/boarding-pass/boarding-ticket/passStorage.js'
import { useBagHandlers } from '@/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx'
import SavePassToast from '@/features/boarding-pass/save-pass-toast/SavePassToast.jsx'
import { getCurrentBoardingPass } from '@/shared/api/boardingPassApi.js'
import stageBack from '@/shared/assets/boarding-pass/complete/stage-back.svg'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'
import { useToast } from '@/shared/ui/toastContext.js'

import styles from './CompletePage.module.scss'

function readStoredPass() {
  try {
    const raw = sessionStorage.getItem(PASS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * (33)(34) 보딩패스 발급 완료 — Figma 532:6102.
 * 티켓 개인정보·QR은 API 응답. 저장 CTA → 하단 토스트(3초 페이드아웃).
 */
function CompletePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const bagHandlers = useBagHandlers()
  const [pass, setPass] = useState(() => location.state?.pass ?? readStoredPass())
  const [error, setError] = useState(null)

  useEffect(() => {
    if (pass) return undefined
    let cancelled = false
    getCurrentBoardingPass()
      .then((data) => {
        if (cancelled) return
        setPass(data)
        sessionStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(data))
      })
      .catch(() => {
        if (!cancelled) setError('발급된 보딩패스를 찾을 수 없습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [pass])

  function handleSavePass() {
    showToast(<SavePassToast />, {
      position: 'bottom',
      duration: 3000,
      closeOnOutsideClick: false,
      className: styles.saveToastShell,
    })
  }

  return (
    <main className={styles.stage}>
      <img src={stageBack} alt="" aria-hidden="true" className={styles.stageBack} />
      <div className={styles.fade} aria-hidden="true" />

      <div className={styles.content}>
        <BoardingPassChrome {...bagHandlers} />

        <section className={styles.body}>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => navigate('/boarding-pass')}
            className={styles.close}
          >
            <img src={closeIcon} alt="" className={styles.closeImg} />
          </button>

          <div className={styles.hero}>
            <div className={styles.titleGroup}>
              <h2 className={styles.title}>MCM BOARDING PASS</h2>
              <p className={styles.subtitle}>당신의 MCM 비행에 완벽한 맞춤형 동선을 추천합니다</p>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={handleSavePass} className={styles.pill}>
                <span className={styles.pillLabel}>BOARDING PASS 저장</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/boarding-pass/scan')}
                className={styles.pill}
              >
                <span className={styles.pillLabel}>매장에서 스캔</span>
              </button>
            </div>
          </div>

          <div className={styles.ticketWrap}>
            {pass ? (
              <BoardingTicketCard pass={pass} size="md" className={styles.ticketCard} />
            ) : (
              <p className={styles.status}>{error ?? '보딩패스를 불러오는 중…'}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default CompletePage
