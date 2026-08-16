import { formatPrice } from './productApi.js'
import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * 층(여행 가이드) API.
 *
 * 화면의 층 열쇠는 `1f` 같은 소문자 키다(boardingPassSteps의 GUIDE_FLOOR_ORDER).
 * 백엔드 floorNo에서 그대로 만들 수 있어 스텝 슬라이더가 층 구성을 몰라도 된다.
 */

function toFloor(floor) {
  return {
    id: `${floor.floorNo}f`,
    floorId: floor.floorId,
    floorNo: floor.floorNo,
    code: floor.code ?? '',
    title: floor.title ?? '',
    subtitle: floor.subtitle ?? '',
    tagline: floor.tagline ?? '',
    audioUrl: floor.audioUrl ?? null,
    // Figma 층 배지 표기: `1F JOURNEY  |  여정`
    badge: `${floor.floorNo}F ${floor.code ?? ''}  |  ${floor.title ?? ''}`,
  }
}

/** GET /floors — 층 목록 (개요 칩) */
export async function getFloors() {
  const result = await apiFetch(API.floor.list, { unwrap: true })
  return {
    storeName: result.storeName ?? '',
    floors: (result.floors ?? []).map(toFloor),
  }
}

/**
 * GET /floors/{floorId} — 층 상세 콘텐츠.
 *
 * contents는 blockType(TEXT·LIST·QUOTE·IMAGE·PRODUCT)별로 화면이 골라
 * 그린다. 순서는 orderNo가 정한다.
 */
export async function getFloor(floorId) {
  const result = await apiFetch(API.floor.detail(floorId), { unwrap: true })
  return {
    ...toFloor(result),
    contents: [...(result.contents ?? [])]
      .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0))
      .map((block) => ({
        orderNo: block.orderNo,
        blockType: block.blockType ?? 'TEXT',
        body: block.body ?? '',
        imageUrl: block.imageUrl ?? null,
        product: block.product
          ? {
              productId: block.product.productId,
              name: block.product.name ?? '',
              priceLabel: formatPrice(block.product.price ?? 0),
              imageUrl: block.product.imageUrl ?? null,
            }
          : null,
      })),
  }
}
