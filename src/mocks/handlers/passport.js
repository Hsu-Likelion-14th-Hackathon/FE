import { http, HttpResponse } from 'msw'

import { API } from '@/shared/api/endpoints.js'

/** 백엔드 공통 응답 래퍼 */
function ok(result) {
  return HttpResponse.json({
    isSuccess: true,
    code: 'COMMON2000',
    message: '성공입니다.',
    result,
  })
}

const passport = {
  passportNo: '0001',
  name: 'YEONJU LIM',
  nationality: 'KOR',
  birthDate: '2000-01-01',
  issuedOn: '2026-08-25',
  creditBalance: 100,
  totalVisitCount: 6,
}

const stamps = [
  { passportStampId: 1, visitLogId: 1, stampedOn: '2026-07-21' },
  { passportStampId: 2, visitLogId: 2, stampedOn: '2026-07-23' },
  { passportStampId: 3, visitLogId: 3, stampedOn: '2026-07-25' },
  { passportStampId: 4, visitLogId: 4, stampedOn: '2026-07-27' },
  { passportStampId: 5, visitLogId: 5, stampedOn: '2026-08-01' },
  { passportStampId: 6, visitLogId: 6, stampedOn: '2026-08-15' },
]

const visitDetail = {
  visitLogId: 4,
  storeName: 'MCM HAUS',
  address: '412 Apgujeong-ro, Gangnam-gu, Seoul of Korea',
  entryNo: '00001',
  scannedAt: '2026-07-27T14:23:00',
  stayMinutes: 46,
  boardingPass: {
    boardingPassId: 7,
    passCode: 'MCM-2026-0805-LIM-YEONJU',
    passengerName: 'YEONJU LIM',
  },
  travelHistory: [
    { sequence: 1, floorNo: 1, code: 'JOURNEY', title: '여정' },
    { sequence: 2, floorNo: 2, code: 'EMBLEM', title: '상징' },
    { sequence: 3, floorNo: 3, code: 'TRY', title: '시도' },
  ],
}

export const passportHandlers = [
  http.get(API.passport.profile, () => ok(passport)),
  http.get(API.passport.stamps, () => ok({ totalVisitCount: passport.totalVisitCount, stamps })),
  http.get(API.passport.visit(':visitLogId'), ({ params }) =>
    ok({ ...visitDetail, visitLogId: Number(params.visitLogId) }),
  ),
]
