import productEconyl from '@/shared/assets/boarding-pass/guide/product-econyl.png'
import productHimmel from '@/shared/assets/boarding-pass/guide/product-himmel.png'
import productToteCognac from '@/shared/assets/boarding-pass/guide/product-tote-cognac.png'
import productTrolley from '@/shared/assets/boarding-pass/guide/product-trolley.png'
import productWeekender from '@/shared/assets/boarding-pass/guide/product-weekender.png'

/** 여행 가이드 층별 카피 (피그마 (44)~(47-1)) */
export const guideFloorContent = {
  overview: {
    introLead: '1976년 뮌헨에서 태어난 이름 하나가',
    introEmphasis: '2026년',
    introTail: ' 다시 같은 질문을 던진다',
    quote: '우리는 어디로, 왜 떠나는가?',
    floors: [
      {
        id: '5f',
        badge: '5F ARRIVE  |  도착',
        subtitle: '모든 여정은 하나의 이름에서 시작된다',
        shape: 'top',
      },
      {
        id: '3f',
        badge: '3F TRY  |  시도',
        subtitle: '다음 50년을 향한 새로운 시작',
        shape: 'mid',
      },
      {
        id: '2f',
        badge: '2F EMBLEM  |  상징',
        subtitle: '로고는 브랜드의 태도를 담는다',
        shape: 'mid',
      },
      {
        id: '1f',
        badge: '1F JOURNEY  |  여정',
        subtitle: '삶은 여행이다, 그러니 잘 떠나야 한다',
        shape: 'bottom',
      },
    ],
  },
  '1f': {
    badge: '1F JOURNEY  |  여정',
    subtitle: '삶은 여행이다, 그러니 잘 떠나야 한다',
    headline: '미하엘 크로머가 처음에 만든 것은 가방이 아닌',
    quote: '이동의 방식',
    panels: [
      {
        blocks: [
          [
            '무겁고 경직된 기존 클래식 트렁크의 틀을 깨고',
            '세계를 무대로 이동하는 ‘글로벌 노마드(Global Nomad)’를 위해',
            '가볍고 튼튼한 트롤리와 트렁크를 만들어냈습니다',
          ],
          ['정착하기보다 떠나는 것을,', '소유하기보다 경험하는 것을 택한 수많은 여행자들'],
        ],
      },
      {
        blocks: [
          ['오리지널 피스들에는 정교하게 그어진 스크래치와', '마모의 흔적이 그대로 남아있습니다'],
          [
            '이 흔적들은 장식품이 아닌 실제로 세계의 국경을 넘나들며 시대를 살아낸',
            '삶의 기록이자 훌륭한 도구였음을 증명합니다',
          ],
        ],
      },
    ],
    products: [
      {
        layout: 'compact',
        image: productTrolley,
        nameLines: ['Ottomar 비세토스', '트롤리'],
        price: '₩2,750,000',
      },
      {
        layout: 'compact',
        image: productWeekender,
        nameLines: ['Ottomar 그라데이션', '비세토스 위켄더'],
        price: '₩2,050,000',
      },
    ],
    productRow: 'pair',
  },
  '2f': {
    badge: '2F EMBLEM  |  상징',
    subtitle: '로고는 브랜드의 태도를 담는다',
    headline: 'LAUREL & VISETOS',
    quote: '비대칭과 마름모가 완성한 아이콘',
    showEmblems: true,
    panels: [
      {
        blocks: [
          ['MCM을 상징하는 월계수(Laurel) 잎의 수량이', '좌우 비대칭이라는 사실을 알고 계신가요?'],
          [
            '이 비대칭은 제작상의 실수가 아닌, 뮌헨을 사랑했던 바이에른 왕국 루드비히 1세의',
            '신고전주의 양식에 바치는 헌신이자 승리와 명예를 상징하는',
            '손그림 문장(紋章) 이었습니다',
          ],
        ],
      },
      {
        blocks: [
          [
            '그 곁을 지키는 비세토스(Visetos) 패턴의 마름모는 바이에른주의 깃발에서',
            '영감을 받아 태어났습니다',
          ],
          ['그리고 이 모든 요소가 집약된 바탕에는 MCM의 고유한 색인', '코냑(Cognac)이 있습니다'],
        ],
      },
    ],
    cognacNote: [
      '숙성된 브랜디의 깊은 황금빛을',
      '머금은 코냑 브라운 컬러는',
      '최상급 가죽의 정통성과 여행자의',
      '빈티지한 감성을 동시에 품은',
      '대표적인 컬러 정체성입니다',
    ],
    products: [
      {
        layout: 'compact',
        image: productToteCognac,
        nameLines: ['뮌헨 비세토스 토트', 'Cognac'],
        price: '₩1,290,000',
      },
    ],
    productRow: 'cognac',
  },
  '3f': {
    badge: '3F TRY  |  시도',
    subtitle: '다음 50년을 향한 새로운 시작',
    headline: '2026년 반세기를 걸어온 MCM은 다시',
    quote: '1970년의 뮌헨처럼 스스로에게 묻습니다',
    panels: [
      {
        blocks: [
          ['다음 세대를 이끌 혁신적인 소재를 만나보세요'],
          [
            'MCM이 제시하는 다음 50년은 과거를 모방하는 것이 아닌',
            '구와 조화를 이루는 순환적 인류의 여정입니다',
          ],
        ],
      },
      {
        blocks: [['이제 당신의 차례입니다', '모두의 여행은 계속됩니다']],
      },
    ],
    products: [
      {
        layout: 'wide',
        image: productHimmel,
        nameLines: ['Himmel Shopper', 'in MIRUM®'],
        detailLines: [
          '식물성 오일, 천연 고무, 벼 껍질 등을 결합해',
          '가죽 고유의 질감과 내구성을 재현한 라인',
        ],
      },
      {
        layout: 'wide',
        image: productEconyl,
        nameLines: ['Ottomar ECONYL®과 가죽이 더해진', '위켄더 백팩'],
        detailLines: [
          '기존 나일론 가방의 경량성과 방수 성능은 그대로 유지하면서도',
          '버려진 어망과 자원을 재활용한 라인',
        ],
      },
    ],
    productRow: 'stack',
  },
  '5f': {
    badge: '5F ARRIVE  |  도착',
    subtitle: '모든 여정은 하나의 이름에서 시작된다',
    headline: '1976년, München',
    quote: '밤의 도시가 낳은 대담함',
    panels: [
      {
        blocks: [
          [
            '1976년, 뮌헨. 데이비드 보위와 프레디 머큐리가',
            '밤거리를 자유롭게 거닐며 예술과 반항을 모의하던 시절',
          ],
          [
            '배우이자 창립자인 미하엘 크로머(Michael Cromer)는',
            '이 도시의 시대정신을 담아낼 하나의 이름을 지었습니다',
          ],
        ],
      },
      {
        blocks: [
          [
            '그것은 단순한 가방 브랜드의 탄생이 아닌',
            '정체되어 있던 당시 럭셔리 씬을 향한 대담한 선언이었습니다',
          ],
          [
            "화려함 그 자체보다 '어디론가 떠날 수 있는 태도'를",
            '가방에 주입하고자 했던 순간',
          ],
        ],
      },
      {
        blocks: [['MCM의 여정은 끝이 아닙니다', '2026년, 지금부터의 시작입니다']],
      },
    ],
  },
}
