import { useParams } from 'react-router'

import RoutePlaceholder from '@/shared/ui/route-placeholder/RoutePlaceholder.jsx'

export function Component() {
  const { productId } = useParams()

  return (
    <RoutePlaceholder title="상품 상세" description="상품 이미지와 옵션 선택 화면 라우트입니다.">
      <p className="text-ink text-sm">상품 ID: {productId}</p>
    </RoutePlaceholder>
  )
}
