import PassNoticeToast from '@/features/boarding-pass/notice-toast/PassNoticeToast.jsx'
import errorIcon from '@/shared/assets/boarding-pass/icons/notice-error.svg'

const COPY = {
  wishlist: {
    title: '위시리스트에 담긴 상품이 없습니다',
    note: '상품을 담은 뒤 다시 이용해 주세요',
  },
  cart: {
    title: '쇼핑백에 담긴 상품이 없습니다',
    note: '상품을 담은 뒤 다시 이용해 주세요',
  },
}

/**
 * (23-1) 빈 위시리스트·쇼핑백 토스트 본문.
 * complete/scan 알림과 같은 PassNoticeToast. 좌측 아이콘만 엑스.
 */
function EmptyBagToast({ bag = 'wishlist' }) {
  const copy = COPY[bag] ?? COPY.wishlist

  return <PassNoticeToast icon={errorIcon} title={copy.title} note={copy.note} />
}

export default EmptyBagToast
