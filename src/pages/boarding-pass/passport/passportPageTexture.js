/**
 * 여권 페이지 한 면을 Canvas 2D로 그려 WebGL 텍스처 소스로 만든다.
 *
 * 3D 책은 DOM을 휘게 할 수 없어 페이지 내용을 이미지로 구워야 한다.
 * 좌표는 Figma 390×844 프레임에서 잰 값을 페이지 로컬(0~PAGE_W, 0~PAGE_H)로 옮긴 것이다.
 * 화면에 보이는 텍스트는 이 캔버스가 담당하고, 접근성 트리는 DOM이 따로 유지한다.
 */

export const PAGE_W = 253.5 // 펼침 507의 한 면
export const PAGE_H = 394
export const COVER_W = 310
/** 신분 정보 줄 간격. 여섯 줄이 안내 문구 위에 들어가는 값이다. */
export const ROW_PITCH = 26

// Figma 52:18703 / 52:18668 실측값
const INK_LABEL = '#c07346' // 라벨
const INK_VALUE = '#fafafa' // 값
const INK_NOTE = '#ffdba0' // 하단 보조행

/** 여권 내지의 크림색 바탕과 결을 깐다. */
function paintBase(ctx, w, h, seed = 0) {
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, '#5a3218')
  gradient.addColorStop(0.5, '#4a2713')
  gradient.addColorStop(1, '#3b1d0d')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // 종이 결 — 가로로 흐르는 미세한 밝기 편차
  ctx.save()
  ctx.globalAlpha = 0.022
  for (let y = 0; y < h; y += 2) {
    const n = Math.sin((y + seed * 37) * 12.9898) * 43758.5453
    ctx.fillStyle = n - Math.floor(n) > 0.5 ? '#ffffff' : '#000000'
    ctx.fillRect(0, y, w, 1)
  }
  ctx.restore()
}

/**
 * 페이지 바탕. Figma가 좌·우로 분할해 준 에셋(65:139 / 65:140)을 그대로 깐다.
 * 펼침 한 장을 코드로 잘라 쓰면 좌우가 뒤바뀌거나 여백이 어긋나므로 분할본을 쓴다.
 */
function paintSpread(ctx, w, h, assets, side) {
  // 낱장은 오른쪽 지면만 보여준다. 내용이 있는 면은 오른쪽 지면 그림 위에
  // 그리고, 빈 뒷면만 왼쪽 지면 그림을 쓴다.
  const image = side === 'left' || side === 'sheetBack' ? assets.pageLeft : assets.pageRight
  if (!image) return
  ctx.drawImage(image, 0, 0, w, h)
}

/**
 * 접지선(안쪽) 그림자. side가 'left'면 오른쪽 가장자리가 어두워진다.
 * 낱장('sheet')은 제본이 없으므로 그림자도 없다.
 */
function paintGutter(ctx, w, h, side) {
  if (side === 'sheet' || side === 'sheetBack') return
  const from = side === 'left' ? w : 0
  const to = side === 'left' ? w - 46 : 46
  const gradient = ctx.createLinearGradient(from, 0, to, 0)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.42)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

/**
 * 여권 내지는 Figma(120:263, 120:282) 전부 Pretendard다. 캔버스는 CSS 변수를
 * 못 읽으므로 --mcm-font-sans와 같은 대체 순서를 여기에도 적어 둔다. 하나만
 * 적어 두면 Pretendard를 못 받았을 때 캔버스만 generic sans로 떨어져, 같은
 * 자리를 재는 DOM(대체는 Apple SD Gothic Neo 등)과 글자 폭이 갈라진다.
 */
export const PAGE_FONT_STACK =
  "Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Segoe UI', sans-serif"

function setFont(ctx, { size, weight = 400, family = PAGE_FONT_STACK }) {
  ctx.font = `${weight} ${size}px ${family}`
}

/**
 * 캔버스 글자는 CSS와 달리 폰트가 늦게 도착해도 알아서 다시 그려지지 않는다.
 * Pretendard보다 먼저 구우면 지면 전체가 대체 글꼴로 굳는다. 굽기 전에 실제로
 * 쓰는 굵기를 먼저 받아 둔다. 다만 폰트를 못 받는 환경에서 여권이 영영 안
 * 나오면 안 되므로 상한을 두고 그냥 진행한다.
 *
 * @returns 상한 안에 폰트가 도착했으면 true. false면 대체 글꼴로 굽게 되므로
 *   호출부가 나중에 한 번 다시 구워야 한다.
 */
export function waitForPageFont(timeout = 1500) {
  const fonts = typeof document === 'undefined' ? null : document.fonts
  if (!fonts?.load) return Promise.resolve(false)
  // 서브셋 woff2라 굵기별로 파일이 갈린다. 한글이 실제로 들어 있는지도 봐야
  // 하므로 지면에 그리는 문구를 그대로 넘긴다.
  const sample = 'NAME 제품 보러가기'
  const ready = Promise.all([
    fonts.load('400 8px Pretendard', sample),
    fonts.load('600 10px Pretendard', sample),
  ]).then(() => fonts.ready)
  const capped = new Promise((resolve) => {
    setTimeout(() => resolve(false), timeout)
  })
  return Promise.race([ready.then(() => true), capped]).then(
    (arrived) => arrived === true,
    () => false,
  )
}

/**
 * 현재 폰트 기준으로 maxWidth에 담기게 줄인다. 넘치면 말줄임표를 붙인다.
 * 호출 전에 ctx.font이 그릴 때와 같아야 폭 계산이 맞는다.
 */
export function ellipsize(ctx, text, maxWidth) {
  if (maxWidth <= 0) return ''
  if (ctx.measureText(text).width <= maxWidth) return text
  // 한 글자씩 재면 긴 이름에서 measureText를 수십 번 부른다. 이분 탐색으로 줄인다.
  let fits = 0
  let over = text.length
  while (fits < over) {
    const mid = Math.ceil((fits + over) / 2)
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) fits = mid
    else over = mid - 1
  }
  return fits > 0 ? `${text.slice(0, fits)}…` : ''
}

/** 라벨과 값 사이 최소 여백. DOM(.profile p의 gap 8px)과 같은 지점에서
 *  말줄임이 걸려야 백엔드가 어떤 이름을 주든 캔버스와 상자가 어긋나지 않는다.
 *  행 폭에 대한 비율로 둬서 배율이 바뀌어도 함께 줄어든다. */
const ROW_GAP_RATIO = 8 / 197

/** 우측 정렬 라벨/값 한 행. Figma 프로필의 197px 폭 행 구성을 따른다. */
function drawRow(ctx, { x, y, width, label, value }) {
  // 10px / line-height 16 → baseline은 행 상단에서 약 12px
  const baseline = y + 12
  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_LABEL
  ctx.textAlign = 'left'
  ctx.fillText(label, x, baseline)
  const labelWidth = ctx.measureText(label).width

  ctx.fillStyle = INK_VALUE
  ctx.textAlign = 'right'
  // 라벨과 값이 한 행을 나눠 쓴다. 긴 이름을 그대로 그리면 왼쪽 라벨 위로
  // 올라타므로 남는 폭에 맞춰 줄인다.
  const room = width - labelWidth - width * ROW_GAP_RATIO
  ctx.fillText(ellipsize(ctx, String(value ?? ''), room), x + width, baseline)
  ctx.textAlign = 'left'
}

/**
 * PASSPORT 워드마크. Figma(120:252)는 글자가 아니라 83x12 그림이다.
 * centerX를 기준으로 가운데 맞춘다.
 */
function drawWordmark(ctx, assets, centerX, y, sx, sy) {
  if (!assets.word) return
  ctx.drawImage(assets.word, centerX - (83 * sx) / 2, y * sy, 83 * sx, 12 * sy)
}

/** 표지 — 커버 이미지 위에 MCM·PASSPORT 워드마크와 엠블럼, 리본을 얹는다. */
function drawCover(ctx, w, h, { assets }) {
  // 표지 이미지는 자체 가죽 색을 갖는다. 내지용 그라디언트를 깔면
  // 알파 영역으로 비쳐 올라와 전체가 밝아지므로 어두운 바탕만 둔다.
  ctx.fillStyle = '#2a1408'
  ctx.fillRect(0, 0, w, h)
  if (assets.cover) ctx.drawImage(assets.cover, 0, 0, w, h)

  const scale = w / COVER_W
  // Figma 52:18582 — 워드마크 y=400.66, 표지 원점 y=340 → 로컬 60.66.
  // (다른 좌표는 상태바 44px를 뺀 값끼리 계산하므로 여기만 기준을 맞춘다.)
  const wordY = 60.66 * (h / PAGE_H)
  if (assets.coverMcm) ctx.drawImage(assets.coverMcm, 37 * scale, wordY, 64 * scale, 21 * scale)
  if (assets.coverStar) ctx.drawImage(assets.coverStar, 104 * scale, wordY, 20 * scale, 21 * scale)
  if (assets.coverWord) ctx.drawImage(assets.coverWord, 129 * scale, wordY, 143 * scale, 21 * scale)
  if (assets.emblem) {
    ctx.drawImage(assets.emblem, 75 * scale, (437 - 296) * (h / PAGE_H), 161 * scale, 143 * scale)
  }
  const bowY = (627 - 296) * (h / PAGE_H)
  if (assets.bowLeft) ctx.drawImage(assets.bowLeft, 30 * scale, bowY, 44 * scale, 33 * scale)
  if (assets.bowRight) ctx.drawImage(assets.bowRight, 236 * scale, bowY, 44 * scale, 33 * scale)
}

/** 신분 정보 면 — Figma (50) 좌측 페이지. */
function drawProfile(ctx, w, h, { profile, assets, side }) {
  paintBase(ctx, w, h, 2)
  paintSpread(ctx, w, h, assets, side)
  paintGutter(ctx, w, h, side)

  const sx = w / PAGE_W
  const sy = h / PAGE_H
  const x = 30 * sx
  const width = 197 * sx

  drawWordmark(ctx, assets, x + width / 2, 23, sx, sy)

  // Figma 120:285 — 매장 사진은 197x114에 0.5px 브라운 테두리와 모서리 8이다.
  if (assets.haus) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, 71 * sy, width, 114 * sy, 8 * sx)
    ctx.clip()
    ctx.drawImage(assets.haus, x, 71 * sy, width, 114 * sy)
    ctx.restore()
    ctx.strokeStyle = INK_LABEL
    ctx.lineWidth = 0.5 * sx
    ctx.beginPath()
    ctx.roundRect(x, 71 * sy, width, 114 * sy, 8 * sx)
    ctx.stroke()
  }

  const rows = [
    ['NUMBER', profile.passportNumber],
    ['NATIONALITY', profile.nationality],
    // 백엔드는 name 한 필드, 기존 고정 데이터는 givenName/surname 분리다.
    ['NAME', profile.name ?? `${profile.givenName} ${profile.surname}`],
    ['DATE OF BIRTH', profile.birthDate ?? ''],
    ['DATE OF ISSUE', profile.issueDate],
    ['CREDIT', String(profile.credit)],
  ]

  // Figma 120:263 — 195에서 시작하고 줄 간격은 26(줄 높이 16 + 사이 10)이다.
  rows.forEach(([label, value], index) => {
    drawRow(ctx, { x, y: (195 + index * ROW_PITCH) * sy, width, label, value })
  })

  // Figma 120:282 — 마지막 줄(341)에서 8px 아래. 8px 글자에 줄 높이 14다.
  const noteY = 360 * sy
  ctx.fillStyle = INK_NOTE
  setFont(ctx, { size: 8, weight: 400 })
  ctx.fillText('크래딧으로 AI 가상 피팅 가능', x, noteY)

  setFont(ctx, { size: 8, weight: 600 })
  ctx.textAlign = 'right'
  const cta = '제품 보러가기'
  ctx.fillText(cta, x + width, noteY)
  // Figma는 밑줄 처리된 링크다.
  const ctaWidth = ctx.measureText(cta).width
  ctx.fillRect(x + width - ctaWidth, noteY + 2, ctaWidth, 0.5)
  ctx.textAlign = 'left'
}

/**
 * 상자를 꽉 채우되 비율은 지킨다. 남는 쪽을 잘라 낸다.
 *
 * Figma도 스탬프를 늘리지 않고 잘라서 넣는다(120:233). 백엔드가 방문마다
 * 다른 그림을 주면 비율도 제각각이라, 상자에 맞춰 늘리면 찌그러진다.
 */
function drawSquareCrop(ctx, image, x, y, size) {
  const source = Math.min(image.width, image.height)
  ctx.drawImage(
    image,
    (image.width - source) / 2,
    (image.height - source) / 2,
    source,
    source,
    x,
    y,
    size,
    size,
  )
}

/** 방문 스탬프 면 — Figma (51) 우측 페이지. */
function drawStamps(ctx, w, h, { profile, stamps, assets, stampImages = {}, side }) {
  paintBase(ctx, w, h, 3)
  paintSpread(ctx, w, h, assets, side)
  paintGutter(ctx, w, h, side)

  const sx = w / PAGE_W
  const sy = h / PAGE_H
  // Figma 71:6119 / 71:6121 — 블록은 프로필 면과 같은 30에서 시작한다.
  const x = 30 * sx

  drawWordmark(ctx, assets, x + 98.5 * sx, 23, sx, sy)

  // 총 방문 횟수 배지 — Figma 71:6119, 로컬 (30, 71) 197x36
  const badgeW = 197 * sx
  const badgeH = 36 * sy
  const badgeY = 71 * sy
  ctx.fillStyle = 'rgba(174, 97, 30, 0.2)'
  ctx.beginPath()
  ctx.roundRect(x, badgeY, badgeW, badgeH, 8 * sx)
  ctx.fill()
  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_VALUE
  ctx.textAlign = 'center'
  ctx.fillText(`총 방문 횟수  |  ${profile.visits}회`, x + badgeW / 2, badgeY + badgeH / 2 + 4)
  ctx.textAlign = 'left'

  if (assets.stampBow) {
    // Figma 71:6142 — 리본이 놓인 칸은 72x61이지만 그중 그림이 차지하는 창은
    // 안쪽 44x33이고, 나머지는 드롭섀도 여백이다. 예전에는 72x61에 통째로
    // 늘려 넣어 세로로 1.56배 찌그러져 있었다.
    ctx.drawImage(assets.stampBow, 107 * sx, 123 * sy, 44 * sx, 33 * sy)
  }

  // Figma 71:6121 — 로컬 (30, 173)에서 3열 2행. 칸은 54x74로 스탬프 54가 위,
  // 날짜 줄(높이 16)이 58 아래에 붙는다. 열 간격 72, 행 간격 94.
  // 스탬프 개수는 사용자마다 다르다(API). 좌표가 순번에서 나오므로 몇 개가
  // 오든 나머지 칸이 비고 배치는 그대로다. 여섯 칸이 설계된 전부다.
  stamps.slice(0, 6).forEach((stamp, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const px = x + col * 72 * sx
    const py = (173 + row * 94) * sy
    // 백엔드가 방문마다 다른 그림을 준다. 아직 못 받았거나 CORS로 막히면
    // 기본 스탬프가 그 자리를 채운다.
    const image = stampImages[stamp.imageUrl] ?? assets.stamp
    if (image) drawSquareCrop(ctx, image, px, py, 54 * sx)
    // Figma 120:234 — 10px Regular. 줄 높이 16이라 baseline은 줄 상단에서 12다.
    setFont(ctx, { size: 10, weight: 400 })
    ctx.fillStyle = INK_LABEL
    ctx.textAlign = 'center'
    ctx.fillText(stamp.date, px + 27 * sx, py + 70 * sy)
    ctx.textAlign = 'left'
  })
}

/**
 * 방문 상세 면 — Figma (52) 52:18978 우측 페이지.
 * 여권 원점(-183, 340) 기준 로컬 좌표: 블록 x=25.5, y=23.
 */
function drawJourney(ctx, w, h, { assets, side, visit }) {
  paintBase(ctx, w, h, 4)
  paintSpread(ctx, w, h, assets, side)
  paintGutter(ctx, w, h, side)

  const sx = w / PAGE_W
  const sy = h / PAGE_H
  const x = 25.5 * sx
  const blockW = 197 * sx

  drawWordmark(ctx, assets, x + blockW / 2, 23, sx, sy)

  // 텍스트 블록: 로컬 y 71 / 89 / 107 / 141 (baseline은 +12, 주소만 +10)
  // Figma 71:6262 — 날짜·매장명·주소는 한 블록으로 라벨색(#c07346)이다.
  // 흰색으로 그리면 아래 '입장 번호' 줄과 구분이 사라진다.
  // 값은 최근 방문 상세(GET /passport/visits/{id})에서 온다.
  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_LABEL
  ctx.fillText(visit?.visitedOn ?? '', x, 83 * sy)
  ctx.fillText(visit?.storeName ?? '', x, 101 * sy)
  setFont(ctx, { size: 8, weight: 400 })
  ctx.fillText(visit?.address ?? '', x, 117 * sy)

  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_VALUE
  if (visit) {
    ctx.fillText(`입장 번호 ${visit.entryNo} | 비행 시간 ${visit.stayMinutes}M`, x, 153 * sy)
  }

  // 기념 아트워크 96×100 두 칸, 가로 간격 5
  const tileY = 167 * sy
  const tileW = 96 * sx
  const tileH = 100 * sy
  const gap = 5 * sx
  ctx.fillStyle = 'rgba(20, 10, 4, 0.5)'
  for (const index of [0, 1]) {
    ctx.beginPath()
    ctx.roundRect(x + index * (tileW + gap), tileY, tileW, tileH, 6 * sx)
    ctx.fill()
  }
  if (assets.journeyDecoration) {
    ctx.drawImage(assets.journeyDecoration, x + 16 * sx, tileY + 39 * sy, 63 * sx, 37 * sy)
  }
  if (assets.journeyTicket) {
    ctx.drawImage(
      assets.journeyTicket,
      x + tileW + gap + 29 * sx,
      tileY + 27 * sy,
      37 * sx,
      55 * sy,
    )
  }

  // 하단 CTA 96×24, 로컬 y=277
  const btnY = 277 * sy
  const btnH = 24 * sy
  ;['TRAVEL HISTORY', 'TICKET'].forEach((label, index) => {
    const bx = x + index * (tileW + gap)
    // Figma 71:6272 — 채움 0.2, 모서리 2, 글자는 Regular다. 테두리는 없다.
    ctx.fillStyle = 'rgba(174, 97, 30, 0.2)'
    ctx.beginPath()
    ctx.roundRect(bx, btnY, tileW, btnH, 2 * sx)
    ctx.fill()
    setFont(ctx, { size: 8, weight: 400 })
    ctx.fillStyle = INK_VALUE
    ctx.textAlign = 'center'
    ctx.fillText(label, bx + tileW / 2, btnY + btnH / 2 + 3)
    ctx.textAlign = 'left'
  })
}

/** 아직 내용이 없는 속지. 표지를 열었을 때 반대편에 놓인다. */
function drawBlank(ctx, w, h, side, assets = {}) {
  paintBase(ctx, w, h, 5)
  paintSpread(ctx, w, h, assets, side)
  paintGutter(ctx, w, h, side)
}

const PAINTERS = {
  cover: drawCover,
  profile: drawProfile,
  stamps: drawStamps,
  journey: drawJourney,
  blankLeft: (ctx, w, h, data) => drawBlank(ctx, w, h, 'left', data.assets),
  blankRight: (ctx, w, h, data) => drawBlank(ctx, w, h, 'right', data.assets),
  // 낱장의 뒷면. 제본 그림자 없이 종이결만 남는다.
  blankSheet: (ctx, w, h, data) => drawBlank(ctx, w, h, 'sheetBack', data.assets),
}

/**
 * 지면 폭을 화면 픽셀로 받아 텍스처 배수를 정한다.
 *
 * 지면은 화면에서 253px 근처로 그려지지만 dpr 3 화면이면 실제로는 760개
 * 픽셀에 찍힌다. 2배(507px)로 구워 두면 WebGL이 1.5배로 늘려 쓰게 되고,
 * 그만큼 획이 뭉개져 Pretendard가 Pretendard처럼 보이지 않는다. 필요한 만큼만
 * 올려 늘어남을 없앤다.
 *
 * 상한 4는 메모리 때문이다. 낱장 다섯 면을 굽는데 4배면 면당 1014x1576이라
 * 이미 20MB를 넘는다. 하한 2는 지금까지 쓰던 값이라 어떤 화면에서도
 * 전보다 나빠지지 않게 한다.
 */
export function texturePixelRatio(leafWidth) {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const needed = (leafWidth * dpr) / PAGE_W
  // 0.5 단위로 끊어 창을 조금 흔들 때마다 다시 굽지 않게 한다.
  return Math.min(Math.max(Math.ceil(needed * 2) / 2, 2), 4)
}

/**
 * 면 하나를 그려 canvas를 돌려준다.
 * @param {keyof PAINTERS} face
 * @param {number} pixelRatio 텍스처 선명도 배수
 */
export function paintFace(face, data, side = 'left', pixelRatio = 2) {
  // 낱장은 한 책등에 묶여 폭이 같다. 펼침에서만 표지가 따로 넓다.
  const isSheet = side === 'sheet' || side === 'sheetBack'
  const width = isSheet ? PAGE_W : face === 'cover' ? COVER_W : PAGE_W
  const height = PAGE_H
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  // 배율을 컨텍스트에 걸어두면 아래 드로잉은 논리 px(폰트 크기 포함)로 다룰 수 있다.
  ctx.scale(pixelRatio, pixelRatio)
  // roundRect 미지원 환경 방어
  if (typeof ctx.roundRect !== 'function') {
    ctx.roundRect = function roundRect(x, y, w, h) {
      this.rect(x, y, w, h)
    }
  }
  ctx.textBaseline = 'alphabetic'

  const paint = PAINTERS[face] ?? PAINTERS.blankLeft
  paint(ctx, width, height, { ...data, side })
  return canvas
}

/**
 * 한 장 모드에서 단계마다 세울 면.
 *
 * 표지는 310, 내지는 253.5로 폭이 다르다. 내지 좌표가 펼침 507의 절반을
 * 기준으로 잡혀 있어서다. 실제 여권도 표지가 내지를 감싸므로 그대로 둔다.
 */
export const SHEET_FACES = ['cover', 'profile', 'stamps', 'journey']
/** 각 장의 뒷면. 실제 여권처럼 내용 없이 종이결만 보인다. */
export const SHEET_BACK = 'blankSheet'

/**
 * 낱장 한 면의 설계 크기.
 *
 * 한 책등에 묶인 장들이라 폭을 통일한다. 표지 페인터가 폭에 비례해 그리므로
 * 내지 폭(253.5)에 맞춰도 표지 배치가 흐트러지지 않는다.
 */
export const SHEET_W = PAGE_W
export const SHEET_H = PAGE_H

/** step(펼침 장면) → 좌·우 면 구성. 표지는 왼쪽 없이 단독으로 선다. */
export function facesForStep(step) {
  switch (step) {
    case 0:
      return { left: null, right: 'cover' }
    case 1:
      return { left: 'profile', right: 'stamps' }
    case 2:
      return { left: 'stamps', right: 'journey' }
    default:
      return { left: 'journey', right: 'blankRight' }
  }
}
