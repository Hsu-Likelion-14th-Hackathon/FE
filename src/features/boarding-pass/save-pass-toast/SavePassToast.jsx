import PassNoticeToast from '@/features/boarding-pass/notice-toast/PassNoticeToast.jsx'
import checkIcon from '@/shared/assets/boarding-pass/scan/credit-icon.svg'

/**
 * Boarding Pass 저장 완료 토스트 본문.
 * AppToast 셸 안에서 사용. 하단 · duration 자동 페이드아웃.
 */
function SavePassToast() {
  return (
    <PassNoticeToast
      icon={checkIcon}
      title="Boarding Pass 저장이 완료 되었습니다."
      note="발급페이지에서 발급받았던 Boarding Pass를 확인할 수 있습니다."
    />
  )
}

export default SavePassToast
