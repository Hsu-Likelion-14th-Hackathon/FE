import PassNoticeToast from '@/features/boarding-pass/notice-toast/PassNoticeToast.jsx'
import errorIcon from '@/shared/assets/boarding-pass/icons/notice-error.svg'

const COPY = {
  wishlist: {
    title: '위시리스트에 담긴 상품이 없습니다',
    note: '눌러서 상품을 담으러 가기',
  },
  cart: {
    title: '쇼핑백에 담긴 상품이 없습니다',
    note: '눌러서 상품을 담으러 가기',
  },
}

/**
 * (23-1) 빈 위시리스트·쇼핑백 토스트 본문.
 * complete/scan 알림과 같은 PassNoticeToast. 좌측 아이콘만 엑스.
 *
 * 빈 화면은 초대다 — 토스트를 누르면 상품 목록으로 간다(onGoProducts).
 */
function EmptyBagToast({ bag = 'wishlist', onGoProducts }) {
  const copy = COPY[bag] ?? COPY.wishlist

  if (!onGoProducts) {
    return <PassNoticeToast icon={errorIcon} title={copy.title} note={copy.note} />
  }

  return (
    <button
      type="button"
      onClick={onGoProducts}
      className="block w-full border-0 bg-transparent p-0 text-left"
      aria-label="상품 목록 보러가기"
    >
      <PassNoticeToast icon={errorIcon} title={copy.title} note={copy.note} />
    </button>
  )
}

export default EmptyBagToast
