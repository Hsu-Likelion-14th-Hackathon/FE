/**
 * T-01 안내 토스트 본문.
 * AppToast 셸(부모 showToast)을 재사용한다. CTA 없음 · X·외부 클릭으로 닫기.
 */
function NoPassToast() {
  return (
    <div className="pr-7">
      <p className="text-sm leading-5">발급된 Boarding Pass가 없습니다.</p>
    </div>
  )
}

export default NoPassToast
