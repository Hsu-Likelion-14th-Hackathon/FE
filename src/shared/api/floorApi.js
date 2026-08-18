import { formatPrice, getProduct } from './productApi.js'
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
 * 층 코드별 가이드 상품.
 *
 * 백엔드가 층 콘텐츠에 PRODUCT 블록을 연결할 여유가 없어(2026-08-18 합의),
 * 프론트가 층 코드에 맞는 상품을 직접 조회해 콘텐츠 끝에 잇는다. 배치는
 * 피그마 가이드(44~47-1) 그대로다. 서버가 나중에 PRODUCT 블록을 주기
 * 시작하면 그 블록을 그대로 쓰고 이 목록은 덧붙이지 않는다.
 */
const GUIDE_PRODUCT_IDS = {
  JOURNEY: [7, 8], // 캐빈 트롤리 · 그라데이션 위켄더
  EMBLEM: [9], // 뮌헨 비세토스 토트
  HORIZON: [10, 11], // HIMMEL 쇼퍼 · ECONYL 위켄더 백팩
}

/** 상세 응답을 층 콘텐츠의 PRODUCT 블록과 같은 모양으로 접는다. */
function toGuideProductBlock(product, orderNo) {
  const color = product.colors.find((item) => item.isDefault) ?? product.colors[0]
  return {
    orderNo,
    blockType: 'PRODUCT',
    body: '',
    imageUrl: null,
    product: {
      productId: product.id,
      name: product.name,
      priceLabel: product.priceLabel,
      imageUrl: color?.images?.[0] ?? null,
    },
  }
}

async function fetchGuideProductBlocks(code, startOrderNo) {
  const ids = GUIDE_PRODUCT_IDS[code] ?? []
  if (!ids.length) return []
  // 상품 하나를 못 불러와도 나머지 카드와 층 이야기는 그대로 보여야 한다.
  const settled = await Promise.allSettled(ids.map((id) => getProduct(id)))
  return settled
    .filter((entry) => entry.status === 'fulfilled' && entry.value)
    .map((entry, index) => toGuideProductBlock(entry.value, startOrderNo + index))
}

/**
 * GET /floors/{floorId} — 층 상세 콘텐츠.
 *
 * contents는 blockType(TEXT·LIST·QUOTE·IMAGE·PRODUCT)별로 화면이 골라
 * 그린다. 순서는 orderNo가 정한다.
 */
export async function getFloor(floorId) {
  const result = await apiFetch(API.floor.detail(floorId), { unwrap: true })
  const contents = [...(result.contents ?? [])]
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
    }))

  // 서버 콘텐츠에 상품이 없으면 가이드 상품을 이어 붙인다(맨 끝, 연번).
  if (!contents.some((block) => block.blockType === 'PRODUCT')) {
    const lastOrderNo = contents.reduce((max, block) => Math.max(max, block.orderNo ?? 0), 0)
    contents.push(...(await fetchGuideProductBlocks(result.code, lastOrderNo + 1)))
  }

  return { ...toFloor(result), contents }
}
