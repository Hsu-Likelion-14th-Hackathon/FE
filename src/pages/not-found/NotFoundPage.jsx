import { Link } from 'react-router'

export function Component() {
  return (
    <section
      className="grid min-h-[var(--mcm-viewport-stable)] content-center gap-4 px-5 py-10"
      aria-labelledby="route-title"
    >
      <div className="grid gap-3">
        <p className="text-ink text-xs font-semibold tracking-[0.12em]">404</p>
        <h1 id="route-title" className="text-ink text-2xl font-semibold tracking-tight">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-ink text-sm leading-6">주소를 확인하거나 메인 화면으로 이동해 주세요.</p>
      </div>
      <Link
        className="bg-ink inline-flex min-h-11 w-fit items-center justify-center rounded-lg px-5 text-sm font-semibold text-white"
        to="/"
      >
        메인으로 돌아가기
      </Link>
    </section>
  )
}
