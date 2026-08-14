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
export const ROW_PITCH = 28

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

function setFont(ctx, { size, weight = 400, family = 'Pretendard, sans-serif' }) {
  ctx.font = `${weight} ${size}px ${family}`
}

/** 우측 정렬 라벨/값 한 행. Figma 프로필의 197px 폭 행 구성을 따른다. */
function drawRow(ctx, { x, y, width, label, value }) {
  // 10px / line-height 16 → baseline은 행 상단에서 약 12px
  const baseline = y + 12
  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_LABEL
  ctx.textAlign = 'left'
  ctx.fillText(label, x, baseline)

  ctx.fillStyle = INK_VALUE
  ctx.textAlign = 'right'
  ctx.fillText(value, x + width, baseline)
  ctx.textAlign = 'left'
}

function drawHeading(ctx, x, y, text) {
  setFont(ctx, { size: 12, weight: 600, family: "'neurimbo_Gothic', Pretendard, sans-serif" })
  ctx.fillStyle = INK_LABEL
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
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

  drawHeading(ctx, x + width / 2, 42 * sy, 'PASSPORT')

  if (assets.haus) ctx.drawImage(assets.haus, x, 71 * sy, width, 113 * sy)

  const rows = [
    ['NUMBER', profile.passportNumber],
    ['NATIONALITY', profile.nationality],
    // 백엔드는 name 한 필드, 기존 고정 데이터는 givenName/surname 분리다.
    ['NAME', profile.name ?? `${profile.givenName} ${profile.surname}`],
    ['DATE OF BIRTH', profile.birthDate ?? ''],
    ['DATE OF ISSUE', profile.issueDate],
    ['CREDIT', String(profile.credit)],
  ]
  // 생년월일이 늘면서 다섯 줄이 여섯 줄이 됐다. 아래 안내 문구(359)와 부딪히지
  // 않도록 줄 간격을 32에서 28로 좁힌다.
  rows.forEach(([label, value], index) => {
    drawRow(ctx, { x, y: (203 + index * ROW_PITCH) * sy, width, label, value })
  })

  // 생년월일이 늘면서 CREDIT 줄이 343까지 내려왔다. 안내 문구도 그만큼 내린다.
  const noteY = 375 * sy
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

/** 방문 스탬프 면 — Figma (51) 우측 페이지. */
function drawStamps(ctx, w, h, { profile, stamps, assets, side }) {
  paintBase(ctx, w, h, 3)
  paintSpread(ctx, w, h, assets, side)
  paintGutter(ctx, w, h, side)

  const sx = w / PAGE_W
  const sy = h / PAGE_H
  const x = 23.5 * sx

  drawHeading(ctx, x + 98.5 * sx, 42 * sy, 'PASSPORT')

  // 총 방문 횟수 배지
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
    ctx.drawImage(assets.stampBow, x + 63 * sx, 116 * sy, 72 * sx, 61 * sy)
  }

  // 3열 2행, 스탬프 54px · 가로 간격 72 · 세로 간격 94
  stamps.slice(0, 6).forEach((stamp, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const px = x + col * 72 * sx
    const py = (173 + row * 94) * sy
    if (assets.stamp) ctx.drawImage(assets.stamp, px, py, 54 * sx, 54 * sy)
    setFont(ctx, { size: 8, weight: 400 })
    ctx.fillStyle = INK_LABEL
    ctx.textAlign = 'center'
    ctx.fillText(stamp.date, px + 27 * sx, py + 68 * sy)
    ctx.textAlign = 'left'
  })
}

/**
 * 방문 상세 면 — Figma (52) 52:18978 우측 페이지.
 * 여권 원점(-183, 340) 기준 로컬 좌표: 블록 x=25.5, y=23.
 */
function drawJourney(ctx, w, h, { assets, side }) {
  paintBase(ctx, w, h, 4)
  paintSpread(ctx, w, h, assets, side)
  paintGutter(ctx, w, h, side)

  const sx = w / PAGE_W
  const sy = h / PAGE_H
  const x = 25.5 * sx
  const blockW = 197 * sx

  drawHeading(ctx, x + blockW / 2, 42 * sy, 'PASSPORT')

  // 텍스트 블록: 로컬 y 71 / 89 / 107 / 141 (baseline은 +12, 주소만 +10)
  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_VALUE
  ctx.fillText('2026 07 27', x, 83 * sy)
  setFont(ctx, { size: 12, weight: 600 })
  ctx.fillText('MCM HAUS', x, 101 * sy)
  setFont(ctx, { size: 6, weight: 400 })
  ctx.fillStyle = INK_LABEL
  ctx.fillText('412 Apgujeong-ro, Gangnam-gu, Seoul of Korea', x, 117 * sy)

  setFont(ctx, { size: 10, weight: 600 })
  ctx.fillStyle = INK_VALUE
  ctx.fillText('입장 번호 00001 | 비행 시간 46M', x, 153 * sy)

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
    ctx.fillStyle = 'rgba(174, 97, 30, 0.5)'
    ctx.beginPath()
    ctx.roundRect(bx, btnY, tileW, btnH, 4 * sx)
    ctx.fill()
    setFont(ctx, { size: 8, weight: 600 })
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
 * 면 하나를 그려 canvas를 돌려준다.
 * @param {keyof PAINTERS} face
 * @param {number} pixelRatio 텍스처 선명도 배수
 */
// 페이지는 화면에서 약 253px로 그려진다. dpr 2 기준 506px면 충분해 2배로 굽는다.
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
