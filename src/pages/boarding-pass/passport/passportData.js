export const passportProfile = {
  passportNumber: '0001',
  surname: 'LIM',
  givenName: 'YEONJU',
  // 백엔드는 alpha-2를 준다. 지면에 alpha-3으로 찍는 것은 표시 단계 변환이다.
  nationality: 'KR',
  birthDate: '2000 01 01',
  issueDate: '2026 08 25',
  credit: 100,
  visits: 6,
}

export const passportStamps = [
  { id: 'stamp-1', date: '2026 07 21' },
  { id: 'stamp-2', date: '2026 07 23' },
  { id: 'stamp-3', date: '2026 07 25' },
  { id: 'stamp-4', date: '2026 07 27' },
  { id: 'stamp-5', date: '2026 08 01' },
  { id: 'stamp-6', date: '2026 08 15' },
]

/**
 * 방문 상세 채움 데이터.
 *
 * GET /passport/visits/{id}와 같은 모양(getVisitDetail 반환값)이다. 실제 방문
 * 기록이 없거나 조회에 실패하면 이 값이 지면과 시트를 채운다 — 스탬프 여섯
 * 개를 채워 보여 주는 것과 같은 이유로, 빈 여권은 데모에서 보여 줄 것이 없다.
 */
export const passportVisit = {
  visitLogId: null,
  storeName: 'MCM HAUS',
  address: '412 Apgujeong-ro, Gangnam-gu, Seoul of Korea',
  entryNo: '00001',
  visitedOn: '2026 07 27',
  stayMinutes: 46,
  passengerName: 'YEONJU LIM',
  passCode: 'MCM-2026-0805-LIM-YEONJU',
  travelHistory: [
    {
      id: 'floor-1',
      floorId: 1,
      floorNo: 1,
      code: 'JOURNEY',
      title: '여정',
      tagline: '삶은 여행이다, 그러니 잘 떠나야 한다',
      isRecommended: true,
      reason: '여정의 시작을 여는 층입니다.',
    },
    {
      id: 'floor-2',
      floorId: 2,
      floorNo: 2,
      code: 'EMBLEM',
      title: '상징',
      tagline: '로고는 브랜드의 태도를 담는다',
      isRecommended: true,
      reason: '브랜드의 상징을 가까이서 볼 수 있습니다.',
    },
    {
      id: 'floor-3',
      floorId: 3,
      floorNo: 3,
      code: 'TRY',
      title: '시도',
      tagline: '다음 50년을 향한 새로운 시작',
    },
  ],
}

export const passportTicket = {
  passengerName: 'YEONJU LIM',
  flightCode: 'MCM 6506',
  cabinClass: 'FIRST CLASS',
  from: { city: 'Seoul', code: 'ICN', localName: '서울' },
  to: { city: 'Munich', code: 'MUC', localName: 'MCM' },
  gate: '1ST FLOOR',
  boardingLabel: 'TUE, 25 AUG 2026',
  timeStart: '11:00 AM',
  timeEnd: '20:00 PM',
  passCode: 'MCM-2026-0805-LIM-YEONJU',
}
