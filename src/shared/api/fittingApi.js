import { apiFetch } from './client.js'
import { API } from './endpoints.js'

/**
 * AI 가상 피팅 API.
 *
 * 흐름: 업로드 URL 발급 → Azure Blob에 PUT → 세션 생성(즉시 PENDING, 크레딧
 * 차감) → 2초 간격 폴링. DONE이면 resultImageUrl이 채워지고, FAILED면 차감된
 * 크레딧이 자동 환급된다.
 *
 * 입는 대상의 열쇠는 productColorId다 — 상품이 아니라 "그 상품의 그 색"을
 * 입는다.
 */

function toSession(result) {
  return {
    fittingSessionId: result.fittingSessionId,
    status: result.status ?? 'PENDING',
    resultImageUrl: result.resultImageUrl ?? null,
    creditCost: result.creditCost ?? 0,
    productColorId: result.productColorId ?? null,
    productId: result.productId ?? null,
    name: result.name ?? '',
    price: result.price ?? 0,
    thumbnailImageUrl: result.thumbnailImageUrl ?? null,
  }
}

/** POST /fitting-sessions/upload-url — uploadUrl은 300초 뒤 만료된다 */
export async function createUploadUrl({ fileName, contentType }) {
  const result = await apiFetch(API.fitting.uploadUrl, {
    method: 'POST',
    body: { fileName, contentType },
    unwrap: true,
  })
  return {
    uploadUrl: result.uploadUrl,
    fileKey: result.fileKey,
    expiresIn: result.expiresIn ?? 300,
  }
}

/**
 * PUT {uploadUrl} — Azure Blob 직접 업로드.
 *
 * 우리 백엔드가 아니다. Bearer를 붙이면 InvalidAuthenticationInfo로 거절된다
 * (인증은 URL 속 SAS가 맡는다). x-ms-blob-type이 없으면 MissingRequiredHeader,
 * 본문은 FormData가 아니라 파일 바이트 그대로다.
 */
export async function uploadToAzure(uploadUrl, file) {
  let response
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-ms-blob-type': 'BlockBlob',
      },
      body: file,
    })
  } catch {
    // 브라우저가 요청 자체를 막으면(스토리지 CORS 규칙 없음 등) fetch가
    // "Failed to fetch"만 던진다. 그대로 보여 주면 무슨 말인지 알 수 없다.
    throw new Error('이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  }
  if (!response.ok) {
    throw new Error(`이미지 업로드에 실패했습니다 (${response.status})`)
  }
}

/**
 * POST /fitting-sessions
 *
 * fileKey를 빼면 회원의 기본 전신 이미지를 쓴다(없으면 404
 * BODY_IMAGE_NOT_FOUND). 잔액이 모자라면 400 INSUFFICIENT_CREDIT — 백엔드
 * message에 충전 안내까지 있어 그대로 보여 준다.
 */
export async function createFittingSession({ productColorId, fileKey }) {
  const result = await apiFetch(API.fitting.create, {
    method: 'POST',
    body: fileKey ? { productColorId, fileKey } : { productColorId },
    unwrap: true,
  })
  return toSession(result)
}

/** GET /fitting-sessions/{fittingSessionId} — 로딩 화면이 2초 간격으로 부른다 */
export async function getFittingSession(fittingSessionId, { signal } = {}) {
  const result = await apiFetch(API.fitting.detail(fittingSessionId), { unwrap: true, signal })
  return toSession(result)
}
