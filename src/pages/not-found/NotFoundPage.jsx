import { Link } from 'react-router'

import RoutePlaceholder from '@/shared/ui/route-placeholder/RoutePlaceholder.jsx'

export function Component() {
  return (
    <RoutePlaceholder
      eyebrow="404"
      title="페이지를 찾을 수 없습니다"
      description="주소를 확인하거나 메인 화면으로 이동해 주세요."
    >
      <Link
        className="bg-ink inline-flex min-h-11 w-fit items-center justify-center rounded-lg px-5 text-sm font-semibold text-white"
        to="/"
      >
        메인으로 돌아가기
      </Link>
    </RoutePlaceholder>
  )
}
