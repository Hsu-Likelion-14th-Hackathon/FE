import PassNoticeToast from '@/features/boarding-pass/notice-toast/PassNoticeToast.jsx'
import checkIcon from '@/shared/assets/boarding-pass/scan/credit-icon.svg'

/**
 * 스캔 성공 후 크레딧 지급 토스트 콘텐츠 (37, M-03 UI only).
 * 잔액·Passport 연동 없음. fixture label/note만 표시한다.
 */
function CreditToast({ credit }) {
  const label = credit?.label ?? 'AI 가상 피팅 크레딧'
  const note = credit?.note ?? '비행 종료 후 Passport에서 확인하실 수 있습니다.'

  return <PassNoticeToast icon={checkIcon} title={`${label}이 지급되었습니다`} note={note} />
}

export default CreditToast
