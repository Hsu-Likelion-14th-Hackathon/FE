import { useParams } from 'react-router'

import RoutePlaceholder from '@/shared/ui/route-placeholder/RoutePlaceholder.jsx'

export function Component() {
  const { productId } = useParams()

  return (
    <RoutePlaceholder
      title="상품 착용"
      description="이미지 업로드와 AI 처리 상태 화면 라우트입니다."
    >
      <p className="text-ink text-sm">상품 ID: {productId}</p>
    </RoutePlaceholder>
  )
}
