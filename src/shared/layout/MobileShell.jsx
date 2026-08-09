/**
 * 모바일 웹 공통 셸.
 * 390 기준 디자인을 320~430 범위에서 유동 대응한다(초기 레이아웃 유지).
 * 상태바·홈 인디케이터 DOM은 구현하지 않는다.
 */
function MobileShell({ children }) {
  return (
    <div className="bg-canvas relative mx-auto flex min-h-[var(--mcm-viewport-stable)] w-full max-w-[var(--mcm-shell-max)] min-w-[var(--mcm-shell-min)] flex-col">
      {children}
    </div>
  )
}

export default MobileShell
