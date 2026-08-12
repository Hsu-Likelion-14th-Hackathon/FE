export const passportProfile = {
  passportNumber: 'MCM 2026 0805',
  surname: 'LIM',
  givenName: 'YEONJU',
  nationality: 'REPUBLIC OF KOREA',
  issueDate: '05 AUG 2026',
  credit: 100,
  visits: 6,
}

export const passportStamps = [
  { id: 'stamp-1', floor: '1F', date: '05 AUG 2026' },
  { id: 'stamp-2', floor: '2F', date: '05 AUG 2026' },
  { id: 'stamp-3', floor: '3F', date: '05 AUG 2026' },
  { id: 'stamp-4', floor: '1F', date: '25 AUG 2026' },
  { id: 'stamp-5', floor: '2F', date: '25 AUG 2026' },
  { id: 'stamp-6', floor: '3F', date: '25 AUG 2026' },
]

export const journeyRecords = [
  { id: 'journey', floor: '1F JOURNEY', title: 'MCM HAUS', date: '25 AUG 2026' },
  { id: 'emblem', floor: '2F EMBLEM', title: 'BRAND ARCHIVE', date: '25 AUG 2026' },
  { id: 'try', floor: '3F TRY', title: 'AI FITTING', date: '25 AUG 2026' },
]

export const passportTicket = {
  passengerName: 'LIM YEONJU',
  flightCode: 'MCM 2026',
  cabinClass: 'FIRST',
  from: { city: 'Seoul', code: 'ICN', localName: '서울' },
  to: { city: 'Munich', code: 'MUC', localName: 'MCM HAUS' },
  gate: 'MCM HAUS',
  boardingLabel: '25 AUG 2026',
  timeStart: '10:00',
  timeEnd: '18:00',
  passCode: 'MCM-2026-0805-LIM-YEONJU',
}
