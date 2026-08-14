import { useState } from 'react'
import { useNavigate } from 'react-router'

import EmptyBagToast from '@/features/boarding-pass/empty-bag-toast/EmptyBagToast.jsx'
import NoPassToast from '@/features/boarding-pass/no-pass-toast/NoPassToast.jsx'
import noticeStyles from '@/features/boarding-pass/notice-toast/PassNoticeToast.module.scss'
import { getLatestBoardingPass } from '@/shared/api/boardingPassApi.js'
import { getCart } from '@/shared/api/cartApi.js'
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
 * - 비행 시작하기: /boarding-pass/survey
 * - 기존 BP 스캔: latest 200 → /boarding-pass/scan, 404 → T-01
 * - 헤더 위시/쇼핑백이 비면 (23-1) 토스트
 * - 상태바·홈 인디케이터는 DOM 미구현
 */
export function Component() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [scanning, setScanning] = useState(false)

  function handleStartFlight() {
    navigate('/boarding-pass/survey')
  }

  async function openBag(bag) {
    const fetchItems = bag === 'cart' ? getCart : getWishlist
    const path = bag === 'cart' ? '/cart' : '/wishlist'
    try {
      const items = await fetchItems()
      if (!items?.length) {
        showToast(<EmptyBagToast bag={bag} />, {
          position: 'bottom',
          duration: 3000,
          closeOnOutsideClick: false,
          className: noticeStyles.shell,
        })
        return
      }
    } catch {
      // 조회 실패 시에는 목적 페이지에서 상태를 보여 준다
    }
    navigate(path)
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
      <StoreHeader
        onWishlistClick={() => openBag('wishlist')}
        onCartClick={() => openBag('cart')}
      />
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
          onClick={() => navigate('/boarding-pass/intro')}
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
