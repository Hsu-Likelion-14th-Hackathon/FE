/**
 * 보딩패스 fixture — 라이브 Swagger 계약과 같은 모양이어야 한다. 목만 다른
 * 모양이면 실서버에서만 드러나는 계약 오류가 숨는다.
 */

/** BoardingPassIssueResponse */
export const issuedBoardingPass = {
  boardingPassId: 7,
  passCode: 'MCM-A1B2C3D4',
  status: 'ISSUED',
  passengerName: 'YEONJU LIM',
  issuedAt: '2026-08-25T11:00:00',
  items: [{ productColorId: 1, name: 'Ottomar 비세토스 위켄더', source: 'WISHLIST' }],
}

/** SurveyQuestionsResponse.questions — 실서버 6문항(Q1~Q5 선택형, Q6 자유형) 축약 */
export const surveyQuestions = [
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
        label: '기원',
        description: '어떻게 시작됐는지, 브랜드의 탄생 이야기',
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
        label: '여정',
        description: '어떻게 움직이는지, 여행과 이동의 철학',
        orderNo: 3,
      },
      {
        surveyOptionId: 8,
        label: '지평',
        description: '어디로 향하는지, 다음 50년의 방향',
        orderNo: 5,
      },
    ],
  },
  {
    surveyQuestionId: 6,
    stepNo: 3,
    content: '오늘 꼭 보고 싶은 아이템이나 이야기가 있다면 자유롭게 적어주세요.',
    questionType: 'TEXT',
    isRequired: false,
    options: [],
  },
]

/** BoardingPassScanResponse */
export const scanSuccessResult = {
  boardingPassId: 7,
  status: 'SCANNED',
  visitLogId: 4,
  entryNo: '00001',
  scannedAt: '2026-08-05T10:12:00',
  earnedCredit: 100,
  creditBalance: 400,
}
