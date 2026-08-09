import DeferredButton from '@/shared/ui/DeferredButton.jsx'

const BAG_LABEL = {
  wishlist: '위시리스트',
  cart: '장바구니',
}

/**
 * 헤더 위시/카트 아이콘 전용 빈 목록 에러 토스트 (토스트 공통 규칙 준수).
 * 상품 페이지 이동 버튼은 D-06 미동작.
 * 「기존 BP 스캔」 플로우에서는 사용하지 않는다.
 */
function EmptyBagToast({ kind = 'wishlist' }) {
  return (
    <div className="flex flex-col gap-2 pr-7">
      <p className="text-sm leading-5">
        {BAG_LABEL[kind] ?? BAG_LABEL.wishlist}에 등록된 상품이 없습니다.
      </p>
      <DeferredButton
        deferredId="D-06"
        className="w-fit text-xs font-semibold text-[#e2c5b0] underline underline-offset-2"
      >
        상품 페이지로 이동
      </DeferredButton>
    </div>
  )
}

export default EmptyBagToast
