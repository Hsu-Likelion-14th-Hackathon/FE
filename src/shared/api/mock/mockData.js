/**
 * 백엔드가 응답하지 않을 때 보여 줄 목 데이터.
 *
 * 모양은 라이브 Swagger 계약(docs/api)과 같아야 한다. 목만 다른 모양이면
 * 실서버에서만 드러나는 계약 오류가 숨는다. 여기 값은 래퍼를 벗긴 `result`다
 * — 래퍼는 mockServer가 씌운다.
 *
 * 이미지는 새로 만들지 않고 앱이 이미 쓰는 에셋을 그대로 쓴다.
 */
import arenBurgundyImage from '@/assets/images/products/aren-burgundy.webp'
import backpackBlackImage from '@/assets/images/products/backpack-black.webp'
import diamantCinnamonImage from '@/assets/images/products/diamant-cinnamon.webp'
import diamantSoftPinkImage from '@/assets/images/products/diamant-soft-pink.webp'
import duffelBlackImage from '@/assets/images/products/duffel-black.webp'
import newLizBeigeImage from '@/assets/images/products/new-liz-beige.webp'
import pinaCinnamonImage from '@/assets/images/products/pina-cinnamon.webp'
// mock-*.webp는 가이드 Figma 크롭(guide/product-*)을 카탈로그 컷 구도(800×866, 여백 포함)로
// 다시 앉힌 사본이다. 카드가 object-fit: cover라 여백 없는 크롭을 쓰면 상품이 칸을 꽉 채워 커 보인다.
import econylImage from '@/assets/images/products/mock-econyl.webp'
import himmelImage from '@/assets/images/products/mock-himmel.webp'
import toteCognacImage from '@/assets/images/products/mock-tote-cognac.webp'
import trolleyImage from '@/assets/images/products/mock-trolley.webp'
import weekenderImage from '@/assets/images/products/mock-weekender.webp'

/* ------------------------------------------------------------------ 상품 */

const BAG_SIZES = [
  { label: 'SMALL', note: null },
  { label: 'MEDIUM', note: null },
  { label: 'LARGE', note: null },
]
const ONE_SIZE = [{ label: 'ONE SIZE', note: null }]

/**
 * id 7~11은 가이드 층 상품(floorApi의 GUIDE_PRODUCT_IDS)과 맞춘다. 가이드는
 * 층 콘텐츠에 상품이 없으면 이 id로 상세를 불러 카드를 붙인다.
 */
const CATALOG = [
  {
    productId: 1,
    name: 'Diamant 비세토스 3D 참',
    price: 490000,
    description: '비세토스 모노그램을 입체 다이아몬드 형태로 빚은 백 참입니다.',
    sizes: ONE_SIZE,
    colors: [
      { colorName: 'Soft Pink', colorHex: '#E8B9B5', image: diamantSoftPinkImage },
      { colorName: 'Cinnamon', colorHex: '#8B4A2B', image: diamantCinnamonImage },
    ],
  },
  {
    productId: 2,
    name: 'New Liz 비세토스 쇼퍼',
    price: 1050000,
    description: '양면으로 쓰는 리버서블 쇼퍼. 분리형 파우치가 함께 구성됩니다.',
    sizes: BAG_SIZES,
    colors: [{ colorName: 'Beige', colorHex: '#D9C3A0', image: newLizBeigeImage }],
  },
  {
    productId: 3,
    name: 'Aren 비세토스 카드 지갑',
    price: 290000,
    description: '슬림한 실루엣에 카드 슬롯 네 칸을 담은 카드 지갑입니다.',
    sizes: ONE_SIZE,
    colors: [{ colorName: 'Burgundy', colorHex: '#6E1F2B', image: arenBurgundyImage }],
  },
  {
    productId: 4,
    name: 'Pina 스터드 장식 크로스바디 월렛',
    price: 830000,
    description: '스터드 장식과 체인 스트랩으로 크로스바디로도 드는 월렛입니다.',
    sizes: ONE_SIZE,
    colors: [{ colorName: 'Cognac', colorHex: '#9A5B2E', image: pinaCinnamonImage }],
  },
  {
    productId: 5,
    name: 'Stark 비세토스 백팩',
    price: 1290000,
    description: '브랜드의 시그니처 스터드 디테일을 더한 MCM 대표 백팩입니다.',
    sizes: BAG_SIZES,
    colors: [{ colorName: 'Black', colorHex: '#1A1A1A', image: backpackBlackImage }],
  },
  {
    productId: 6,
    name: 'Traveler 비세토스 더플백',
    price: 1490000,
    description: '짧은 여행을 위한 넉넉한 수납의 더플백입니다.',
    sizes: BAG_SIZES,
    colors: [{ colorName: 'Black', colorHex: '#1A1A1A', image: duffelBlackImage }],
  },
  {
    productId: 7,
    name: '비세토스 캐빈 트롤리',
    price: 1890000,
    description: '기내 반입 규격에 맞춘 하드 셸 캐빈 트롤리입니다.',
    sizes: ONE_SIZE,
    colors: [{ colorName: 'Cognac', colorHex: '#9A5B2E', image: trolleyImage }],
  },
  {
    productId: 8,
    name: '그라데이션 비세토스 위켄더',
    price: 1650000,
    description: '그라데이션 모노그램이 돋보이는 위켄더 백입니다.',
    sizes: ONE_SIZE,
    colors: [{ colorName: 'Gradient', colorHex: '#B78A5C', image: weekenderImage }],
  },
  {
    productId: 9,
    name: '뮌헨 비세토스 토트',
    price: 1190000,
    description: '1976년 뮌헨에서 시작된 비세토스 패턴의 클래식 토트입니다.',
    sizes: BAG_SIZES,
    colors: [{ colorName: 'Cognac', colorHex: '#9A5B2E', image: toteCognacImage }],
  },
  {
    productId: 10,
    name: 'HIMMEL 라미네이티드 쇼퍼',
    price: 1350000,
    description: '하늘(Himmel)에서 이름을 따온 가벼운 라미네이티드 쇼퍼입니다.',
    sizes: BAG_SIZES,
    colors: [{ colorName: 'Cognac', colorHex: '#9A5B2E', image: himmelImage }],
  },
  {
    productId: 11,
    name: 'ECONYL 위켄더 백팩',
    price: 990000,
    description: '재생 나일론 ECONYL®로 만든 위켄더 겸용 백팩입니다.',
    sizes: BAG_SIZES,
    colors: [{ colorName: 'Black', colorHex: '#1A1A1A', image: econylImage }],
  },
]

/** productColorId = productId * 10 + 색상 순번, productSizeId = productColorId * 10 + 사이즈 순번 */
export const PRODUCTS = CATALOG.map((product) => ({
  ...product,
  colors: product.colors.map((color, colorIndex) => {
    const productColorId = product.productId * 10 + colorIndex + 1
    return {
      productColorId,
      colorName: color.colorName,
      colorHex: color.colorHex,
      isDefault: colorIndex === 0,
      images: [color.image],
      sizes: product.sizes.map((size, sizeIndex) => ({
        productSizeId: productColorId * 10 + sizeIndex + 1,
        sizeLabel: size.label,
        sizeNote: size.note,
        sku: `MCM-${product.productId}-${color.colorName.toUpperCase().replace(/\s+/g, '')}-${size.label.replace(/\s+/g, '')}`,
        stock: 5,
      })),
    }
  }),
}))

export function findColor(productColorId) {
  for (const product of PRODUCTS) {
    const color = product.colors.find((item) => item.productColorId === productColorId)
    if (color) return { product, color }
  }
  return null
}

export function findSize(productSizeId) {
  for (const product of PRODUCTS) {
    for (const color of product.colors) {
      const size = color.sizes.find((item) => item.productSizeId === productSizeId)
      if (size) return { product, color, size }
    }
  }
  return null
}

/* ------------------------------------------------------------------ 회원 */

export const DEFAULT_MEMBER = {
  userId: 1,
  email: 'guest@mcm.demo',
  provider: 'LOCAL',
  name: 'YEONJU LIM',
  nationality: 'KR',
  birthDate: '2000-01-01',
  passportNo: '0001',
}

/* ------------------------------------------------------------------ 설문 */

export const SURVEY_QUESTIONS = [
  {
    surveyQuestionId: 1,
    stepNo: 1,
    content: '오늘 MCM Haus에 오신 목적은?',
    questionType: 'SINGLE_SELECT',
    isRequired: true,
    options: [
      {
        surveyOptionId: 1,
        label: '감상',
        description: '브랜드 헤리티지와 전시를 감상하러 왔어요',
        orderNo: 1,
      },
      {
        surveyOptionId: 2,
        label: '구매',
        description: '관심 있는 제품을 보거나 구매하러 왔어요',
        orderNo: 2,
      },
      {
        surveyOptionId: 3,
        label: '둘 다',
        description: '전시도 보고, 쇼핑도 편하게 즐기고 싶어요',
        orderNo: 3,
      },
    ],
  },
  {
    surveyQuestionId: 2,
    stepNo: 2,
    content: '지금 가장 끌리는 이야기는 무엇인가요?',
    questionType: 'SINGLE_SELECT',
    isRequired: true,
    options: [
      {
        surveyOptionId: 4,
        label: '여정',
        description: '어떻게 움직이는지, 여행과 이동의 철학',
        orderNo: 1,
      },
      {
        surveyOptionId: 5,
        label: '상징',
        description: '무엇이 다른지, 로고와 패턴에 담긴 디자인 철학',
        orderNo: 2,
      },
      {
        surveyOptionId: 6,
        label: '시도',
        description: '어디로 향하는지, 새로운 소재와 다음 50년',
        orderNo: 3,
      },
    ],
  },
  {
    surveyQuestionId: 3,
    stepNo: 3,
    content: '평소 어떤 스타일의 가방을 즐겨 드시나요?',
    questionType: 'SINGLE_SELECT',
    isRequired: true,
    options: [
      {
        surveyOptionId: 7,
        label: '클래식',
        description: '시간이 지나도 변하지 않는 모노그램',
        orderNo: 1,
      },
      { surveyOptionId: 8, label: '캐주얼', description: '가볍고 실용적인 데일리 백', orderNo: 2 },
      {
        surveyOptionId: 9,
        label: '트래블',
        description: '여행과 이동을 위한 넉넉한 수납',
        orderNo: 3,
      },
    ],
  },
  {
    surveyQuestionId: 4,
    stepNo: 4,
    content: '오늘 머무를 수 있는 시간은 어느 정도인가요?',
    questionType: 'SINGLE_SELECT',
    isRequired: true,
    options: [
      {
        surveyOptionId: 10,
        label: '30분 이내',
        description: '핵심만 빠르게 둘러보고 싶어요',
        orderNo: 1,
      },
      {
        surveyOptionId: 11,
        label: '1시간 정도',
        description: '여유 있게 둘러보고 싶어요',
        orderNo: 2,
      },
      {
        surveyOptionId: 12,
        label: '충분해요',
        description: '모든 층을 천천히 즐기고 싶어요',
        orderNo: 3,
      },
    ],
  },
  {
    surveyQuestionId: 5,
    stepNo: 5,
    content: '누구와 함께 오셨나요?',
    questionType: 'SINGLE_SELECT',
    isRequired: true,
    options: [
      { surveyOptionId: 13, label: '혼자', description: '나만의 속도로 둘러볼래요', orderNo: 1 },
      {
        surveyOptionId: 14,
        label: '친구·연인',
        description: '함께 사진도 남기고 싶어요',
        orderNo: 2,
      },
      {
        surveyOptionId: 15,
        label: '가족',
        description: '모두가 즐길 수 있는 동선이 좋아요',
        orderNo: 3,
      },
    ],
  },
  {
    surveyQuestionId: 6,
    stepNo: 6,
    content: '오늘 꼭 보고 싶은 아이템이나 이야기가 있다면 자유롭게 적어주세요.',
    questionType: 'TEXT',
    isRequired: false,
    options: [],
  },
]

/* -------------------------------------------------------------- 층·동선 */

export const STORE = {
  storeName: 'MCM HAUS',
  address: '412 Apgujeong-ro, Gangnam-gu, Seoul of Korea',
}

export const FLOORS = [
  {
    floorId: 1,
    floorNo: 1,
    code: 'JOURNEY',
    title: '여정',
    subtitle: 'THE ART OF TRAVEL',
    tagline: '삶은 여행이다, 그러니 잘 떠나야 한다',
    audioUrl: null,
  },
  {
    floorId: 2,
    floorNo: 2,
    code: 'EMBLEM',
    title: '상징',
    subtitle: 'LAUREL & VISETOS',
    tagline: '로고는 브랜드의 태도를 담는다',
    audioUrl: null,
  },
  {
    floorId: 3,
    floorNo: 3,
    code: 'TRY',
    title: '시도',
    subtitle: 'THE NEXT 50 YEARS',
    tagline: '다음 50년을 향한 새로운 시작',
    audioUrl: null,
  },
]

/** 층 상세의 PRODUCT 블록은 비워 둔다 — floorApi가 가이드 상품(7~11)을 붙인다. */
export const FLOOR_CONTENTS = {
  1: [
    {
      orderNo: 1,
      blockType: 'TEXT',
      body: '1976년 뮌헨에서 시작된 MCM은 "Modern Creation München"의 약자입니다. 여행은 처음부터 MCM의 언어였습니다.',
    },
    { orderNo: 2, blockType: 'LIST', body: '1976년 뮌헨 창립' },
    { orderNo: 3, blockType: 'LIST', body: '제트족 시대의 럭셔리 트래블 백' },
    { orderNo: 4, blockType: 'QUOTE', body: '잘 떠나는 법을 아는 사람이 잘 돌아온다.' },
  ],
  2: [
    {
      orderNo: 1,
      blockType: 'TEXT',
      body: '월계관(Laurel)과 비세토스(Visetos) 패턴은 승리와 자부심, 그리고 바이에른의 장인 정신을 상징합니다.',
    },
    { orderNo: 2, blockType: 'LIST', body: '월계관 엠블럼 — 승리와 명예' },
    { orderNo: 3, blockType: 'LIST', body: '비세토스 모노그램 — 반복되는 다이아몬드 패턴' },
  ],
  3: [
    {
      orderNo: 1,
      blockType: 'TEXT',
      body: '재생 나일론 ECONYL®과 가벼운 라미네이티드 소재로, MCM은 다음 50년의 여행을 준비합니다.',
    },
    { orderNo: 2, blockType: 'QUOTE', body: '새로운 시도는 늘 가장 MCM다운 일이었다.' },
  ],
}

export function routeReason(floor, index) {
  return (
    [
      '여정의 시작을 여는 층입니다.',
      '브랜드의 상징을 가까이서 볼 수 있습니다.',
      '새로운 소재와 다음 50년을 만나는 층입니다.',
    ][index] ?? `${floor.title} 층을 둘러보세요.`
  )
}

/* --------------------------------------------------------------- 보딩패스 */

export const SCAN_CREDIT = 100
export const FITTING_CREDIT_COST = 50
