/**
 * 보딩패스 fixture.
 * 화면 문구·필드는 피그마 (33)(34)(42) 티켓 디자인과 대조해 SA-ISSUE/SA-FLIGHT가 보강한다.
 */
export const issuedBoardingPass = {
  boardingPassId: 'MCM-BP-20260805-001',
  id: 'MCM-BP-20260805-001',
  /** FE QR 생성용 코드 (react-qr-code value) */
  passCode: 'MCM-PASS-20260805-001',
  status: 'ISSUED',
  passengerName: 'YEONJU LIM',
  flightCode: 'MCM 6506',
  cabinClass: 'FIRST CLASS',
  from: { city: 'SEOUL', code: 'ICN', localName: '서울' },
  to: { city: 'MUNICH', code: 'MUC', localName: 'MCM' },
  gate: '1ST FLOOR',
  seat: 'VIP 01',
  boardingAt: '2026-08-25T11:00:00+09:00',
  boardingLabel: 'TUE, 25 AUG 2026',
  timeStart: '11:00 AM',
  timeEnd: '20:00 PM',
  /** passCode 없을 때 QR fallback */
  qrData: 'https://mcm-haus.example/boarding-pass/MCM-BP-20260805-001',
  recommendedFloors: ['1F', '2F', '3F'],
}

/** GET /api/surveys/questions — 피그마 (24)~(29) 문항 */
export const surveyQuestions = [
  {
    id: 1,
    label: 'Q1',
    titleLines: ['오늘 MCM HAUS에', '오신 목적은 무엇인가요?'],
    description: '고객님의 취향 분석을 위한 수속 절차를 진행하겠습니다',
    options: [
      { id: 11, title: '감상', description: '브랜드 헤리티지와 전시를 감상하러 왔어요' },
      { id: 12, title: '구매', description: '관심 있는 제품을 보거나 구매하러 왔어요' },
      { id: 13, title: '둘 다', description: '전시도 보고 쇼핑도 편하게 즐기고 싶어요' },
    ],
  },
  {
    id: 2,
    label: 'Q2',
    titleLines: ['지금 가장 끌리는 것은', '무엇인가요?'],
    description: '고객님의 취향 분석을 위한 수속 절차를 진행하겠습니다',
    options: [
      { id: 21, title: '헤리티지', description: '어떻게 시작됐는지, 브랜드의 탄생 이야기' },
      { id: 22, title: '디자인', description: '무엇이 다른지, 로고와 패턴에 담긴 디자인 철학' },
      { id: 23, title: '여행', description: '어떻게 움직이는지, 여행과 이동의 철학' },
      { id: 24, title: '비전', description: '어디로 향하는지, 다음 50년의 방향' },
    ],
  },
  {
    id: 3,
    label: 'Q3',
    titleLines: ['평소 나의 스타일에', '가장 가까운 것은 무엇인가요?'],
    description: '고객님의 취향 분석을 위한 수속 절차를 진행하겠습니다',
    options: [
      { id: 31, title: '클래식', description: '클래식하고 헤리티지가 느껴지는 것' },
      { id: 32, title: '실용', description: '실용적이고 이동에 최적화된 것' },
      { id: 33, title: '미니멀', description: '미니멀하고 지속가능한 소재 중심인 것' },
    ],
  },
]

export const scanSuccessResult = {
  status: 'SUCCESS',
  scannedAt: '2026-08-05T10:12:00+09:00',
  credit: {
    amount: 100,
    label: 'AI 가상 피팅 크레딧',
    /** 실제 지급·잔액 반영은 M-03 후속. 토스트 UI 문구용 데이터만 제공한다. */
    note: '비행 종료 후 Passport에서 확인하실 수 있습니다.',
  },
}
