import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import EmptyBagToast from '@/features/boarding-pass/empty-bag-toast/EmptyBagToast.jsx'
import NoPassToast from '@/features/boarding-pass/no-pass-toast/NoPassToast.jsx'
import noticeStyles from '@/features/boarding-pass/notice-toast/PassNoticeToast.module.scss'
import { getLatestBoardingPass } from '@/shared/api/boardingPassApi.js'
import { getWishlist } from '@/shared/api/wishlistApi.js'
import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import ctaPlaneIcon from '@/shared/assets/boarding-pass/landing/cta-plane.svg'
import planeImage from '@/shared/assets/boarding-pass/landing/plane.png'
import stageBack from '@/shared/assets/boarding-pass/landing/stage-back.svg'
import StoreHeader from '@/shared/layout/store-header/StoreHeader.jsx'
import { useToast } from '@/shared/ui/toastContext.js'

import styles from './LandingPage.module.scss'

/**
 * (23) 보딩패스 랜딩 — Figma 492:4896.
 * - 비행 시작하기: /boarding-pass/intro
 * - 기존 BP 스캔: latest 200 → /boarding-pass/scan, 404 → T-01
 * - 진입 시 위시리스트가 비어 있으면 (23-1) 토스트 — 누르면 상품 목록으로
 * - 상태바·홈 인디케이터는 DOM 미구현
 */
export function Component() {
  const navigate = useNavigate()
  const { showToast, hideToast } = useToast()
  const [scanning, setScanning] = useState(false)

  // 랜딩에 들어온 순간 위시리스트를 확인한다. 아이콘을 눌러야 알려 주는
  // 안내는 이미 담으러 갈 사람에게만 보인다 — 초대는 먼저 건네야 한다.
  useEffect(() => {
    const controller = new AbortController()

    getWishlist({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted || items?.length) return
        showToast(
          <EmptyBagToast
            bag="wishlist"
            // 빈 화면은 초대다 — 토스트를 누르면 상품 목록으로 간다.
            onGoProducts={() => {
              hideToast()
              navigate('/products')
            }}
          />,
          {
            position: 'bottom',
            duration: 4000,
            closeOnOutsideClick: false,
            className: noticeStyles.shell,
          },
        )
      })
      .catch(() => {
        // 비로그인(401)·네트워크 실패에는 초대를 건네지 않는다.
      })

    return () => controller.abort()
  }, [showToast, hideToast, navigate])

  function handleStartFlight() {
    navigate('/boarding-pass/intro')
  }

  async function handleScanExisting() {
    if (scanning) return
    setScanning(true)
    try {
      const pass = await getLatestBoardingPass()
      if (pass) {
        navigate('/boarding-pass/scan')
        return
      }
      // T-01: 저장 완료 토스트 셸 재사용 · 안내 카피만 · CTA 없음
      showToast(<NoPassToast />, { position: 'center' })
    } catch {
      // 네트워크 등 기타 오류는 조용히 무시 (404만 null 처리)
    } finally {
      setScanning(false)
    }
  }

  return (
    <main className="flex min-h-[var(--mcm-viewport-stable)] flex-col bg-[#fafafa]">
      <StoreHeader />
      <section
        className={styles.stage}
        style={{
          minHeight:
            'calc(var(--mcm-viewport-stable) - var(--mcm-header-height) - var(--mcm-safe-top))',
        }}
      >
        <img src={stageBack} alt="" aria-hidden="true" className={styles.stageBack} />
        <div className={styles.footerFade} aria-hidden="true" />

        <button
          type="button"
          className={styles.close}
          aria-label="닫기"
          onClick={() => navigate('/')}
        >
          <img src={closeIcon} alt="" className={styles.closeImg} />
        </button>

        <div className={styles.body}>
          <div className={styles.copyBlock}>
            <div className={styles.titleGroup}>
              <h2 className={styles.title}>MCM BOARDING PASS</h2>
              <p className={styles.subtitle}>당신의 MCM 비행에 완벽한 맞춤형 동선을 추천합니다</p>
            </div>
            <p className={styles.storeNote}>이 행사는 MCM HAUS 매장 기반으로 진행됩니다</p>
          </div>

          <div className={styles.planeWrap}>
            <div className={styles.planeFrame} aria-hidden="true">
              <img src={planeImage} alt="" className={styles.planeGlow} />
            </div>
            <div className={styles.planeFrame}>
              <img src={planeImage} alt="" className={styles.plane} />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryCta} onClick={handleStartFlight}>
              <span>비행 시작하기</span>
              <img src={ctaPlaneIcon} alt="" aria-hidden="true" className={styles.ctaPlane} />
            </button>
            <div className={styles.secondaryRow}>
              <button
                type="button"
                className={styles.secondaryCta}
                onClick={handleScanExisting}
                disabled={scanning}
              >
                <span className={styles.secondaryCtaLabel}>기존 BOARDING PASS 스캔</span>
              </button>
              <button
                type="button"
                className={styles.secondaryCta}
                onClick={() => navigate('/boarding-pass/passport')}
              >
                <span className={styles.secondaryCtaLabel}>PASSPORT 확인</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
