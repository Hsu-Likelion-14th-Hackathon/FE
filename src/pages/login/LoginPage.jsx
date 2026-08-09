import { useNavigate } from 'react-router-dom'

import BoardingPassChrome from '@/shared/layout/BoardingPassChrome.jsx'
import DeferredButton from '@/shared/ui/DeferredButton.jsx'

/**
 * 로그인 stub (M-02).
 * 미로그인 상태에서 (23) 동작 CTA가 도달하는 화면. 카카오 등 실제 로그인은 후속.
 */
function LoginPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-[var(--mcm-viewport-stable)] flex-col">
      <BoardingPassChrome showIconRow={false} />
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <div>
          <h2 className="font-brand text-ink text-2xl">LOGIN</h2>
          <p className="text-muted mt-3 text-sm leading-6">
            로그인 화면은 준비 중입니다.
            <br />
            비행을 계속하려면 이전 화면으로 돌아가 주세요.
          </p>
        </div>
        <DeferredButton
          deferredId="M-02"
          className="bg-kakao w-full max-w-[280px] rounded-lg py-3.5 text-sm font-semibold text-[#191919]"
        >
          카카오로 시작하기 (준비 중)
        </DeferredButton>
        <button
          type="button"
          onClick={() => navigate('/boarding-pass')}
          className="text-muted text-sm underline underline-offset-4"
        >
          보딩패스 홈으로 돌아가기
        </button>
      </section>
    </main>
  )
}

export default LoginPage
