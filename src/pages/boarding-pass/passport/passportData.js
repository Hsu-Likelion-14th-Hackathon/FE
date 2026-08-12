export const passportProfile = {
  passportNumber: '0001',
  surname: 'LIM',
  givenName: 'YEONJU',
  nationality: 'REPUBLIC OF KOREA',
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

export const journeyRecords = [
  {
    id: 'journey',
    floor: '1F JOURNEY | 여정',
    title: '삶은 여행이다, 그러니 잘 떠나야 한다',
    date: '2026 07 27',
  },
  {
    id: 'emblem',
    floor: '2F EMBLEM | 상징',
    title: '로고는 브랜드의 태도를 담는다',
    date: '2026 07 27',
  },
  { id: 'try', floor: '3F TRY | 시도', title: '다음 50년을 향한 새로운 시작', date: '2026 07 27' },
]

export const passportTicket = {
  passengerName: 'YEONJU LIM',
  flightCode: 'MCM 6506',
  cabinClass: 'FIRST CLASS',
  from: { city: 'Seoul', code: 'ICN', localName: '서울' },
  to: { city: 'Munich', code: 'MUC', localName: 'MCM HAUS' },
  gate: '1ST FLOOR',
  boardingLabel: 'TUE, 25 AUG 2026',
  timeStart: '11:00 AM',
  timeEnd: '20:00 PM',
  passCode: 'MCM-2026-0805-LIM-YEONJU',
}
