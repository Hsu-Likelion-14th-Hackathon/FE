/**
 * 백엔드 대신 응답하는 브라우저 안의 가짜 서버.
 *
 * apiFetch가 백엔드에 닿지 못할 때(네트워크 실패·타임아웃·5xx) 여기로
 * 돌린다. 경로·메서드·응답 래퍼를 실서버와 같게 맞춰, 화면과 도메인
 * API(authApi·boardingPassApi …)는 목인지 모른 채 그대로 동작한다.
 *
 * 쓰기(위시리스트·쇼핑백·발급·스캔 …)는 sessionStorage에 남겨, 새로고침해도
 * 이어서 보이고 탭을 닫으면 처음으로 돌아간다.
 */
import {
  DEFAULT_MEMBER,
  findColor,
  findSize,
  FITTING_CREDIT_COST,
  FLOOR_CONTENTS,
  FLOORS,
  PRODUCTS,
  routeReason,
  SCAN_CREDIT,
  STORE,
  SURVEY_QUESTIONS,
} from './mockData.js'

const STATE_KEY = 'mcm-mock-state'

function initialState() {
  return {
    member: { ...DEFAULT_MEMBER },
    issuedOn: today(),
    credit: 300,
    // 처음부터 비어 있으면 랜딩에 "위시리스트가 비었다" 토스트만 보인다.
    wishlist: [21, 91],
    bag: [],
    nextId: 100,
    pass: null,
    visits: [],
    stamps: [],
    fittings: {},
  }
}

let memoryState = null

function loadState() {
  if (memoryState) return memoryState
  try {
    const raw = sessionStorage.getItem(STATE_KEY)
    memoryState = raw ? { ...initialState(), ...JSON.parse(raw) } : initialState()
  } catch {
    memoryState = initialState()
  }
  return memoryState
}

function saveState() {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(memoryState))
  } catch {
    // 저장이 막혀도 이번 페이지 동안은 메모리 상태로 동작한다.
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function now() {
  // 백엔드처럼 타임존 없는 로컬 시각(LocalDateTime) 문자열
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 19)
}

function nextId(state) {
  state.nextId += 1
  return state.nextId
}

const ok = (result) => ({
  status: 200,
  body: { isSuccess: true, code: 'COMMON2000', message: '성공입니다.', result },
})

const fail = (status, code, message) => ({
  status,
  body: { isSuccess: false, code, message, result: null },
})

const MOCK_TOKEN = 'mock-access-token'

/* --------------------------------------------------------------- 변환 */

function productSummary(product, color, state) {
  return {
    productId: product.productId,
    productColorId: color.productColorId,
    name: product.name,
    price: product.price,
    thumbnailImageUrl: color.images[0] ?? null,
    colors: product.colors.map(({ productColorId, colorName, colorHex, isDefault }) => ({
      productColorId,
      colorName,
      colorHex,
      isDefault,
    })),
    isWished: state.wishlist.includes(color.productColorId),
  }
}

function productDetail(product, state) {
  return {
    productId: product.productId,
    name: product.name,
    price: product.price,
    description: product.description,
    colors: product.colors.map((color) => ({
      productColorId: color.productColorId,
      colorName: color.colorName,
      colorHex: color.colorHex,
      isDefault: color.isDefault,
      images: color.images,
      sizes: color.sizes,
      isWished: state.wishlist.includes(color.productColorId),
    })),
  }
}

function memberResult(state) {
  const { member } = state
  return {
    userId: member.userId,
    email: member.email,
    provider: member.provider,
    name: member.name,
    nationality: member.nationality,
    birthDate: member.birthDate,
    passportNo: member.passportNo,
    defaultBodyImageUrl: member.defaultBodyImageUrl ?? null,
  }
}

function routeSteps(passId) {
  return {
    boardingPassId: passId,
    steps: FLOORS.map((floor, index) => ({
      sequence: index + 1,
      floorId: floor.floorId,
      floorNo: floor.floorNo,
      code: floor.code,
      title: floor.title,
      subtitle: floor.subtitle,
      tagline: floor.tagline,
      isRecommended: index < 2,
      reason: index < 2 ? routeReason(floor, index) : null,
    })),
  }
}

/* ------------------------------------------------------------- 라우팅 */

/**
 * [메서드, 경로 패턴, 처리기]. 패턴의 `:name`은 숫자 경로 조각을 받는다.
 * 처리기는 (state, { params, body, query })를 받아 { status, body }를 돌려준다.
 */
const ROUTES = [
  /* 인증·회원 */
  [
    'POST',
    '/auth/login',
    (state, { body }) => {
      if (body?.email) state.member.email = body.email
      return ok({ accessToken: MOCK_TOKEN, userId: state.member.userId })
    },
  ],
  [
    'POST',
    '/auth/signup',
    (state, { body }) => {
      if (body?.email) state.member.email = body.email
      return ok({ accessToken: MOCK_TOKEN, userId: state.member.userId })
    },
  ],
  [
    'POST',
    '/auth/kakao',
    (state) => {
      state.member.provider = 'KAKAO'
      return ok({ accessToken: MOCK_TOKEN, userId: state.member.userId, isNewUser: false })
    },
  ],
  [
    'POST',
    '/auth/profile',
    (state, { body }) => {
      Object.assign(state.member, pickProfile(body))
      return ok(memberResult(state))
    },
  ],
  ['GET', '/users/me', (state) => ok(memberResult(state))],
  [
    'PATCH',
    '/users/me',
    (state, { body }) => {
      Object.assign(state.member, pickProfile(body))
      return ok(memberResult(state))
    },
  ],
  [
    'PUT',
    '/users/me/body-image',
    (state, { body }) => {
      state.member.defaultBodyImageUrl = body?.fileKey ? PRODUCTS[0].colors[0].images[0] : null
      return ok({ bodyImageUrl: state.member.defaultBodyImageUrl })
    },
  ],
  [
    'DELETE',
    '/users/me/body-image',
    (state) => {
      state.member.defaultBodyImageUrl = null
      return ok({ deleted: true })
    },
  ],

  /* 상품 */
  [
    'GET',
    '/products',
    (state) =>
      ok(
        PRODUCTS.flatMap((product) =>
          product.colors.map((color) => productSummary(product, color, state)),
        ),
      ),
  ],
  [
    'GET',
    '/products/:productId',
    (state, { params }) => {
      const product = PRODUCTS.find((item) => item.productId === params.productId)
      return product
        ? ok(productDetail(product, state))
        : fail(404, 'PRODUCT404', '상품을 찾을 수 없습니다.')
    },
  ],

  /* 위시리스트 */
  [
    'GET',
    '/wishlist',
    (state) =>
      ok({
        items: state.wishlist
          .map(findColor)
          .filter(Boolean)
          .map(({ product, color }) => ({
            productColorId: color.productColorId,
            productId: product.productId,
            name: product.name,
            price: product.price,
            thumbnailImageUrl: color.images[0] ?? null,
            colorName: color.colorName,
          })),
      }),
  ],
  [
    'POST',
    '/wishlist',
    (state, { body }) => {
      const id = Number(body?.productColorId)
      if (!findColor(id)) return fail(404, 'PRODUCT404', '상품을 찾을 수 없습니다.')
      if (!state.wishlist.includes(id)) state.wishlist.unshift(id)
      return ok({ productColorId: id, added: true })
    },
  ],
  [
    'DELETE',
    '/wishlist/:productColorId',
    (state, { params }) => {
      const before = state.wishlist.length
      state.wishlist = state.wishlist.filter((id) => id !== params.productColorId)
      return ok({ productColorId: params.productColorId, removed: state.wishlist.length < before })
    },
  ],

  /* 쇼핑백 */
  [
    'GET',
    '/shopping-bag',
    (state) =>
      ok({
        items: state.bag
          .map((item) => ({ item, found: findSize(item.productSizeId) }))
          .filter(({ found }) => found)
          .map(({ item, found: { product, color, size } }) => ({
            shoppingBagItemId: item.shoppingBagItemId,
            productSizeId: size.productSizeId,
            productId: product.productId,
            name: product.name,
            price: product.price,
            thumbnailImageUrl: color.images[0] ?? null,
            colorName: color.colorName,
            sizeLabel: size.sizeLabel,
            sizeNote: size.sizeNote,
            sku: size.sku,
            quantity: item.quantity,
          })),
      }),
  ],
  [
    'POST',
    '/shopping-bag',
    (state, { body }) => {
      const productSizeId = Number(body?.productSizeId)
      if (!findSize(productSizeId)) return fail(404, 'PRODUCT404', '상품을 찾을 수 없습니다.')
      const existing = state.bag.find((item) => item.productSizeId === productSizeId)
      if (existing) existing.quantity += 1
      else state.bag.unshift({ shoppingBagItemId: nextId(state), productSizeId, quantity: 1 })
      const item = existing ?? state.bag[0]
      return ok({ shoppingBagItemId: item.shoppingBagItemId, quantity: item.quantity })
    },
  ],
  [
    'DELETE',
    '/shopping-bag/:shoppingBagItemId',
    (state, { params }) => {
      const before = state.bag.length
      state.bag = state.bag.filter((item) => item.shoppingBagItemId !== params.shoppingBagItemId)
      return ok({ shoppingBagItemId: params.shoppingBagItemId, removed: state.bag.length < before })
    },
  ],

  /* 설문·보딩패스 */
  ['GET', '/surveys/questions', () => ok({ questions: SURVEY_QUESTIONS })],
  [
    'POST',
    '/boarding-passes',
    (state, { body }) => {
      const id = nextId(state)
      const passengerName = state.member.name || 'GUEST'
      // 동의했으면 위시리스트에서, 아니면 설문만으로 고른 것처럼 대표 상품을 싣는다.
      const items = (body?.dataConsent ? state.wishlist.slice(0, 2) : [91])
        .map(findColor)
        .filter(Boolean)
        .map(({ product, color }) => ({
          productColorId: color.productColorId,
          name: product.name,
          source: body?.dataConsent ? 'WISHLIST' : 'SURVEY',
        }))
      state.pass = {
        boardingPassId: id,
        passCode: `MCM-${String(id).padStart(4, '0')}-${passengerName.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`,
        status: 'ISSUED',
        passengerName,
        issuedAt: now(),
        items,
      }
      return ok(state.pass)
    },
    1800,
  ],
  [
    'GET',
    '/boarding-passes/latest',
    (state) =>
      state.pass ? ok(state.pass) : fail(404, 'BOARDING_PASS404', '발급된 보딩패스가 없습니다.'),
  ],
  [
    'POST',
    '/boarding-passes/:id/scan',
    (state, { params }) => {
      if (!state.pass || state.pass.boardingPassId !== params.id) {
        return fail(404, 'BOARDING_PASS404', '보딩패스를 찾을 수 없습니다.')
      }
      const visitLogId = nextId(state)
      const scannedAt = now()
      state.credit += SCAN_CREDIT
      state.pass.status = 'SCANNED'
      state.visits.push({
        visitLogId,
        entryNo: String(state.visits.length + 1).padStart(5, '0'),
        scannedAt,
        stayMinutes: 0,
        boardingPass: {
          boardingPassId: state.pass.boardingPassId,
          passCode: state.pass.passCode,
          passengerName: state.pass.passengerName,
        },
      })
      const visit = state.visits.at(-1)
      return ok({
        boardingPassId: state.pass.boardingPassId,
        status: 'SCANNED',
        visitLogId,
        entryNo: visit.entryNo,
        scannedAt,
        earnedCredit: SCAN_CREDIT,
        creditBalance: state.credit,
      })
    },
    300,
  ],
  ['GET', '/boarding-passes/:id/route', (state, { params }) => ok(routeSteps(params.id))],
  [
    'POST',
    '/boarding-passes/:id/complete',
    (state, { params }) => {
      const visit = state.visits.findLast((item) => item.boardingPass.boardingPassId === params.id)
      const stayMinutes = visit
        ? Math.max(1, Math.round((Date.now() - new Date(visit.scannedAt).getTime()) / 60000))
        : 46
      if (visit) visit.stayMinutes = stayMinutes
      if (state.pass?.boardingPassId === params.id) state.pass.status = 'COMPLETED'
      const passportStampId = nextId(state)
      state.stamps.push({
        passportStampId,
        visitLogId: visit?.visitLogId ?? null,
        stampedOn: today(),
      })
      return ok({
        boardingPassId: params.id,
        status: 'COMPLETED',
        stayMinutes,
        passportStampId,
        totalVisitCount: state.stamps.length,
      })
    },
  ],

  /* 층 */
  [
    'GET',
    '/floors',
    () =>
      ok({ storeName: STORE.storeName, introAudioUrl: null, guideAudioUrl: null, floors: FLOORS }),
  ],
  [
    'GET',
    '/floors/:floorId',
    (state, { params }) => {
      const floor = FLOORS.find((item) => item.floorId === params.floorId)
      if (!floor) return fail(404, 'FLOOR404', '층을 찾을 수 없습니다.')
      return ok({
        ...floor,
        contents: (FLOOR_CONTENTS[floor.floorId] ?? []).map((block) => ({
          imageUrl: null,
          product: null,
          ...block,
        })),
      })
    },
  ],

  /* 여권 */
  [
    'GET',
    '/passport',
    (state) =>
      ok({
        passportNo: state.member.passportNo,
        name: state.member.name,
        nationality: state.member.nationality,
        birthDate: state.member.birthDate,
        issuedOn: state.issuedOn,
        creditBalance: state.credit,
        totalVisitCount: state.stamps.length,
      }),
  ],
  [
    'GET',
    '/passport/stamps',
    (state) =>
      ok({
        totalVisitCount: state.stamps.length,
        stamps: state.stamps.map((stamp) => ({ ...stamp, stampAssetUrl: null })),
      }),
  ],
  ['GET', '/passport/credits', (state) => ok({ creditBalance: state.credit, histories: [] })],
  [
    'GET',
    '/passport/visits/:visitLogId',
    (state, { params }) => {
      const visit = state.visits.find((item) => item.visitLogId === params.visitLogId)
      if (!visit) return fail(404, 'VISIT404', '방문 기록을 찾을 수 없습니다.')
      return ok({
        ...visit,
        storeName: STORE.storeName,
        address: STORE.address,
        travelHistory: routeSteps(visit.boardingPass.boardingPassId).steps.map((step) => ({
          sequence: step.sequence,
          floorId: step.floorId,
          floorNo: step.floorNo,
          code: step.code,
          title: step.title,
          tagline: step.tagline,
        })),
      })
    },
  ],

  /* AI 피팅 — 업로드는 건너뛰고, 결과 이미지는 고른 상품 사진으로 대신한다 */
  [
    'POST',
    '/fitting-sessions/upload-url',
    (state, { body }) =>
      ok({
        uploadUrl: MOCK_UPLOAD_URL,
        fileKey: `mock/${Date.now()}-${body?.fileName ?? 'body.jpg'}`,
        expiresIn: 300,
      }),
  ],
  [
    'POST',
    '/fitting-sessions',
    (state, { body }) => {
      const found = findColor(Number(body?.productColorId))
      if (!found) return fail(404, 'PRODUCT404', '상품을 찾을 수 없습니다.')
      if (state.credit < FITTING_CREDIT_COST) {
        return fail(400, 'CREDIT_NOT_ENOUGH', '크레딧이 부족합니다.')
      }
      state.credit -= FITTING_CREDIT_COST
      const id = nextId(state)
      state.fittings[id] = {
        fittingSessionId: id,
        productColorId: found.color.productColorId,
        createdAt: Date.now(),
      }
      return ok(fittingResult(state.fittings[id]))
    },
  ],
  [
    'GET',
    '/fitting-sessions/:id',
    (state, { params }) => {
      const session = state.fittings[params.id]
      return session
        ? ok(fittingResult(session))
        : fail(404, 'FITTING404', '피팅 세션을 찾을 수 없습니다.')
    },
  ],
]

/** 업로드 URL 자리. fittingApi.uploadToAzure가 이 값이면 PUT을 건너뛴다. */
export const MOCK_UPLOAD_URL = 'mock://upload'

function fittingResult(session) {
  const { product, color } = findColor(session.productColorId)
  // 실서버처럼 잠시 PENDING이었다가 DONE이 된다(로딩 연출).
  const done = Date.now() - session.createdAt > 3000
  return {
    fittingSessionId: session.fittingSessionId,
    status: done ? 'DONE' : 'PENDING',
    resultImageUrl: done ? (color.images[0] ?? null) : null,
    creditCost: FITTING_CREDIT_COST,
    productColorId: color.productColorId,
    productId: product.productId,
    name: product.name,
    price: product.price,
    thumbnailImageUrl: color.images[0] ?? null,
  }
}

function pickProfile(body) {
  const next = {}
  if (body?.name) next.name = String(body.name)
  if (body?.birthDate) next.birthDate = String(body.birthDate)
  if (body?.nationality) next.nationality = String(body.nationality).toUpperCase()
  return next
}

const COMPILED = ROUTES.map(([method, pattern, handler, delayMs = 150]) => {
  const names = []
  const source = pattern.replace(/:(\w+)/g, (_, name) => {
    names.push(name)
    return '(\\d+)'
  })
  return { method, regex: new RegExp(`^${source}/?$`), names, handler, delayMs }
})

/**
 * 완성된 요청 URL에서 백엔드 경로만 남긴다.
 * `https://host/products?x=1`, `/backend/products` → `/products`
 */
function toBackendPath(url, baseUrl) {
  let path = String(url)
  if (baseUrl && path.startsWith(baseUrl)) path = path.slice(baseUrl.length)
  else {
    try {
      path = new URL(path, 'http://mock.local').pathname
    } catch {
      // 그대로 둔다
    }
  }
  return path.split('?')[0] || '/'
}

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

/**
 * 목 응답을 만든다. 처리기가 없는 경로면 null.
 * @returns {Promise<{ status: number, body: object } | null>}
 */
export async function mockRespond({ url, method = 'GET', body, baseUrl, signal }) {
  const path = toBackendPath(url, baseUrl)
  const upper = method.toUpperCase()
  for (const route of COMPILED) {
    if (route.method !== upper) continue
    const match = route.regex.exec(path)
    if (!match) continue
    const params = Object.fromEntries(
      route.names.map((name, index) => [name, Number(match[index + 1])]),
    )
    await wait(route.delayMs, signal)
    const state = loadState()
    const response = route.handler(state, { params, body })
    saveState()
    return response
  }
  return null
}

/** 테스트·데모 초기화용 */
export function resetMockState() {
  memoryState = initialState()
  saveState()
}
