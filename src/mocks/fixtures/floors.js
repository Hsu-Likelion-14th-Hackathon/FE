/** 층·동선 fixture — 라이브 Swagger·실서버 데이터와 같은 모양(축약). */

export const floorList = {
  storeName: 'MCM HAUS',
  floors: [
    {
      floorId: 1,
      floorNo: 1,
      code: 'ORIGIN',
      title: '기원',
      subtitle: '1976, MÜNCHEN',
      tagline: '모든 여정은 하나의 이름에서 시작된다',
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
      code: 'JOURNEY',
      title: '여정',
      subtitle: 'THE ART OF TRAVEL',
      tagline: '삶은 여행이다, 그러니 잘 떠나야 한다',
      audioUrl: null,
    },
    {
      floorId: 5,
      floorNo: 5,
      code: 'HORIZON',
      title: '지평',
      subtitle: 'THE NEXT 50 YEARS',
      tagline: '다음 50년을 향한 새로운 시작',
      audioUrl: null,
    },
  ],
}

export const floorDetails = {
  1: {
    ...floorList.floors[0],
    contents: [
      {
        orderNo: 1,
        blockType: 'TEXT',
        body: '1976년, 뮌헨. 데이비드 보위와 프레디 머큐리가 밤거리를 거닐던 시절의 이야기.',
        imageUrl: null,
        product: null,
      },
      { orderNo: 2, blockType: 'LIST', body: '1976년 뮌헨 창립', imageUrl: null, product: null },
      {
        orderNo: 3,
        blockType: 'LIST',
        body: '미하엘 크로머(Michael Cromer)의 이니셜',
        imageUrl: null,
        product: null,
      },
    ],
  },
}

export const routeSteps = {
  boardingPassId: 7,
  steps: [
    {
      sequence: 1,
      floorId: 1,
      floorNo: 1,
      code: 'ORIGIN',
      title: '기원',
      subtitle: '1976, MÜNCHEN',
      tagline: '모든 여정은 하나의 이름에서 시작된다',
      isRecommended: true,
      reason: '기본 동선',
    },
    {
      sequence: 2,
      floorId: 5,
      floorNo: 5,
      code: 'HORIZON',
      title: '지평',
      subtitle: 'THE NEXT 50 YEARS',
      tagline: '다음 50년을 향한 새로운 시작',
      isRecommended: false,
      reason: null,
    },
  ],
}
