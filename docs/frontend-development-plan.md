# 프론트엔드 개발 계획

## 1. 문서 개요

- 프로젝트 유형: 해커톤 공모전용 모바일 우선 프론트엔드
- 구현 범위: 현재 Figma에 완성된 화면과 상태
- 기술 스택: React, JavaScript, Tailwind CSS, SCSS Modules
- 배포 환경: Vercel
- 백엔드 연동: API 명세 확정 전까지 Mock API를 사용하고, 이후 실제 API로 교체
- 디자인 원본: [Figma 디자인](https://www.figma.com/design/aklj7UjNcG6PDFJVRU9JXv/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=0-1&m=dev)
- 관련 문서:
  - [PRD](./prd.md)
  - [기능 명세](./Specification.md)

현재 저장소는 기획 문서만 존재하는 신규 프로젝트 상태다. 개발은 초기 환경 설정부터 시작하며, 첫 커밋은 프로젝트 초기 설정으로 구성한다.

## 2. 개발 목표

1. Figma 디자인을 모바일 웹에서 최대한 동일하게 재현한다.
2. Chrome, Safari, 카카오 및 네이버 인앱 브라우저에서 일관된 화면을 제공한다.
3. 390px Figma 기준 화면을 중심으로 320px부터 430px까지 깨지지 않는 반응형 레이아웃을 구현한다.
4. API 명세가 확정되기 전에도 실제 API를 사용하는 것과 동일한 데이터 흐름을 구성한다.
5. 페이지별 정상, 선택, 빈 데이터, 로딩 상태를 모두 구현하고 검증한다.
6. 기능을 최소 단위로 나누어 커밋하며, 커밋 메시지는 태그와 한글 설명으로 작성한다.

## 3. 현재 Figma 화면 범위

모든 기준 프레임은 390×844 모바일 화면이다.

| 영역 | Figma 노드 | 구현할 화면 및 상태 |
| --- | --- | --- |
| 메인 및 진입 | `24:360`, `24:429`, `24:781` | 보딩 히어로, 컬렉션 콘텐츠, 로그인 진입 |
| 로그인 | `24:556` | 카카오 로그인 |
| 회원가입 | `24:613`, `24:861`, `24:697` | 기본 입력 폼, 국적 선택 목록, 국적 선택 완료 |
| 상품 목록 | `24:956`, `24:1561`, `24:1690` | 상단 콘텐츠, 상품 그리드, 스크롤 상태 |
| 상품 상세 | `24:1040`, `24:1200`, `24:1121` | 색상 선택, 재고 표시, 위시리스트 상태 |
| AI 상품 착용 | `24:1289`, `24:1359`, `24:1425`, `24:1492` | 이미지 업로드, 0%, 중간, 100% 진행 상태 |
| 위시리스트 | `24:1900`, `24:1962` | 빈 상태, 상품 3개가 담긴 상태 |
| 쇼핑백 | `24:2059`, `24:2123` | 빈 상태, 상품 2개와 결제 CTA가 있는 상태 |

일부 Figma 프레임 이름은 실제 내용과 일치하지 않으며, 동일 화면을 서로 다른 스크롤 위치나 선택 상태로 캡처한 프레임이 포함되어 있다. 해당 프레임을 별도 페이지로 만들지 않고 하나의 라우트 안에서 데이터, 스크롤 또는 사용자 선택 상태로 통합한다.

## 4. 페이지 라우팅

| 경로 | 화면 | 주요 기능 |
| --- | --- | --- |
| `/` | 메인 | 보딩 히어로, 컬렉션 콘텐츠, 주요 화면 진입 |
| `/login` | 로그인 | 카카오 로그인 진입 |
| `/signup` | 회원가입 | 이름, 생년월일, 국적 입력 및 검증 |
| `/products` | 상품 목록 | 컬렉션 소개, 2열 상품 목록, 위시 상태 |
| `/products/:productId` | 상품 상세 | 이미지, 색상, 재고, 위시리스트, 쇼핑백 추가 |
| `/products/:productId/try-on` | AI 상품 착용 | 이미지 업로드 및 처리 진행률 |
| `/wishlist` | 위시리스트 | 빈 상태, 저장 상품 목록 |
| `/cart` | 쇼핑백 | 빈 상태, 상품 선택·삭제·수량 및 결제 CTA |
| `*` | Not Found | 잘못된 경로에서 메인으로 복귀 |

상품 목록의 여러 Figma 프레임은 하나의 세로 스크롤 페이지로 구현한다. 상품 상세의 여러 프레임은 색상 및 위시리스트 선택 상태로 구현한다.

## 5. 기술 구성

### 5.1 기본 환경

- React + Vite + JavaScript
- npm 및 `package-lock.json`
- Node 버전 고정
- ESLint 및 Prettier
- 환경 변수 예시 파일 `.env.example`
- Vercel SPA 라우팅 설정

### 5.2 주요 라이브러리

| 목적 | 도구 | 사용 범위 |
| --- | --- | --- |
| 라우팅 | React Router | 페이지 이동, 직접 URL 접근 |
| 서버 상태 | TanStack Query | 상품, 회원, 위시리스트, 쇼핑백 API 상태 |
| 클라이언트 상태 | Zustand | 선택 옵션, 임시 UI 상태, AI 착용 진행 상태 |
| 폼 | React Hook Form | 회원가입 입력 상태와 오류 처리 |
| 검증 | Zod | 회원가입 요청 데이터 검증 |
| Mock API | MSW | 개발 및 테스트 환경의 네트워크 응답 대체 |
| 단위 테스트 | Vitest, React Testing Library | 로직 및 컴포넌트 테스트 |
| E2E 및 시각 테스트 | Playwright | 주요 흐름, 브라우저 및 스크린샷 검증 |

의존성은 초기 설정 시점의 안정 버전으로 설치하고 lockfile에 고정한다.

## 6. 스타일링 전략

Tailwind CSS와 SCSS를 같은 파일의 전처리 과정에 섞지 않고 역할을 분리한다.

- Tailwind CSS
  - 레이아웃
  - 여백과 정렬
  - 반응형 스타일
  - 단순 hover, active, focus 상태
- SCSS Modules
  - 메인 히어로의 복잡한 배치
  - 브랜드 비주얼과 그래디언트
  - 복잡한 전환 및 애니메이션
  - 브라우저별 세부 보정
- CSS Custom Properties
  - 색상
  - 타이포그래피
  - 간격
  - radius
  - shadow
  - z-index

Figma에서 확인된 주요 색상은 다음과 같다.

| 용도 | 값 |
| --- | --- |
| 기본 배경 | `#FAFAFA` |
| 기본 텍스트 | `#191919` |
| 브랜드 브라운 | `#C07346` |
| 보조 텍스트 | `#777777` |
| 상품 카드 배경 | `#F2F2F2` |
| 카카오 로그인 | `#FFE812` |

Figma에서 확인된 주요 폰트는 Pretendard와 `neurimbo_Gothic`이다. 정확한 재현을 위해 저장소에 웹폰트 파일을 포함하고 weight별 `@font-face`를 구성한다. 폰트 파일과 웹 사용 라이선스를 확보하지 못하면 대체 폰트를 사용하되 디자인 차이를 기록하고 컨펌받는다.

## 7. 권장 프로젝트 구조

```text
src/
  app/
    App.jsx
    router.jsx
    providers.jsx
  pages/
    home/
    login/
    signup/
    product-list/
    product-detail/
    try-on/
    wishlist/
    cart/
  features/
    auth/
    product-option/
    favorite/
    cart/
    try-on/
  entities/
    product/
    user/
    cart/
  shared/
    api/
      client.js
      endpoints.js
      queryKeys.js
      mappers/
    assets/
    hooks/
    layout/
    lib/
    ui/
  mocks/
    browser.js
    handlers/
    fixtures/
  styles/
    tailwind.css
    globals.scss
    _tokens.scss
    _mixins.scss
```

의존 방향은 `pages → features/entities → shared`를 유지한다. 페이지와 컴포넌트는 fixture 파일을 직접 참조하지 않는다.

## 8. 공통 컴포넌트 계획

### 8.1 레이아웃

- `MobileShell`
- `AppHeader`
- `BrandBanner`
- `PageContainer`
- `StickyActionBar`
- `CartWishlistTabs`

### 8.2 기본 UI

- `Button`
- `IconButton`
- `InputField`
- `SelectField`
- `Checkbox`
- `Toast`
- `LoadingSpinner`
- `ProgressBar`
- `EmptyState`
- `ErrorState`

### 8.3 상품 UI

- `ProductCard`
- `ProductGrid`
- `ProductImageGallery`
- `ProductPrice`
- `FavoriteButton`
- `ColorSelector`
- `StockLabel`
- `CartItem`

### 8.4 AI 착용 UI

- `TryOnUploader`
- `TryOnPreview`
- `TryOnProcessing`
- `TryOnProgress`

Figma에서 반복되는 요소는 공통 컴포넌트로 먼저 구현하고, 화면별 차이는 `variant`와 상태 값으로 처리한다.

## 9. API 연동 준비

### 9.1 기본 원칙

1. 화면은 실제 API와 동일한 fetch 경로를 호출한다.
2. 개발 환경에서는 MSW가 해당 요청을 가로채 fixture 응답을 반환한다.
3. API 명세가 확정되면 endpoint와 DTO mapper를 변경한다.
4. React 컴포넌트는 백엔드 DTO를 직접 사용하지 않고 화면 모델을 사용한다.
5. JavaScript 프로젝트에서도 JSDoc typedef로 요청 및 응답 형식을 기록한다.

### 9.2 예상 API 경계

```text
authApi.loginWithKakao()
authApi.signup()
productApi.getProducts()
productApi.getProduct(productId)
wishlistApi.getWishlist()
wishlistApi.toggleWishlist(productId)
cartApi.getCart()
cartApi.addItem(payload)
cartApi.updateItem(itemId, payload)
cartApi.removeItem(itemId)
tryOnApi.createJob(file, productId)
tryOnApi.getJob(jobId)
```

### 9.3 환경 변수

```text
VITE_API_BASE_URL=
VITE_ENABLE_MSW=true
```

- Preview와 Production 환경 변수를 분리한다.
- Production 빌드에서는 Mock API를 비활성화한다.
- 비밀 키를 `VITE_` 환경 변수나 클라이언트 번들에 포함하지 않는다.
- 카카오 인증 방식과 callback 경로는 백엔드 API 명세 확정 후 연결한다.

### 9.4 AI 착용 상태 모델

```text
idle
  → image-selected
  → uploading
  → processing
  → success
  → error
```

현재 Figma에는 업로드와 로딩 상태까지만 존재한다. 성공 결과, 실패, 취소 및 재시도 UI는 후속 디자인 또는 별도 컨펌 후 구현한다.

## 10. 모바일 브라우저 대응

### 10.1 지원 기준

- 초기 가정: iOS Safari 16.4 이상
- 현재 Android Chrome 및 Android System WebView
- 현재 카카오 및 네이버 인앱 브라우저
- 자동 검증 viewport: 320, 360, 375, 390, 412, 430px
- 실제 기기 검증: 소형, 노치, 일반, 대형 화면 단말

최소 OS 또는 구형 WebView 지원이 필요하면 Vite build target과 polyfill 범위를 별도로 조정한다.

### 10.2 공통 구현 원칙

- `viewport-fit=cover` 적용
- `env(safe-area-inset-*)` 반영
- `100vh` fallback과 `100svh`, `100dvh` 병행
- 주소창 확장 및 축소 시 화면 점프 방지
- 소프트 키보드가 입력창, 오류 메시지, CTA를 가리지 않도록 처리
- iOS 입력 자동 확대를 고려해 입력 폰트 16px 기준 검토
- 터치 영역 최소 44×44 CSS px
- hover에만 의존하는 기능 금지
- 고정 및 sticky UI의 safe-area 반영
- 이미지에 `aspect-ratio`를 지정해 레이아웃 이동 방지
- 320px에서 가로 스크롤 및 콘텐츠 잘림 금지
- 브라우저 뒤로 가기 시 상품 목록 스크롤 위치 복원

Figma에 표시된 `9:41` 상태바와 하단 홈 인디케이터는 모바일 기기 UI를 표현한 목업 요소로 간주한다. 실제 웹 DOM에서는 중복 구현하지 않고 브라우저 safe-area로 대응한다. 만약 서비스 내부 UI로 사용해야 한다면 구현 전에 별도 확인한다.

## 11. 인터랙션 및 애니메이션 제안

디자인에 명시되지 않은 애니메이션은 기능 구현 후 개별 컨펌을 받는다.

- 메인 `Boarding` 버튼 눌림 및 페이지 전환
- 메인 히어로 이미지의 제한적인 fade 또는 parallax
- 상품 카드 이미지 hover 및 touch active
- 위시리스트 하트의 짧은 pop 애니메이션
- 상품 색상 변경 시 이미지 crossfade
- 쇼핑백 추가 완료 Toast
- AI 착용 로딩 spinner 및 진행 바 애니메이션
- CTA의 hover, focus-visible, active 상태
- 빈 상태에서 콘텐츠가 나타날 때 짧은 fade-in

모든 애니메이션은 `prefers-reduced-motion`을 지원한다. 모바일에서는 hover가 없어도 동일한 기능을 사용할 수 있어야 한다.

## 12. 단계별 구현 및 커밋 계획

커밋 형식은 `<태그>: <한글 메시지>`로 통일한다.

1. `chore: React Vite 프론트엔드 초기 환경 설정`
2. `style: 피그마 디자인 토큰과 전역 모바일 스타일 구성`
3. `feat: 공통 모바일 셸과 페이지 라우팅 구현`
4. `feat: 공통 헤더와 아이콘 인터랙션 구현`
5. `feat: Mock API와 응답 변환 계층 구성`
6. `feat: 상품 카드와 상품 그리드 공통 컴포넌트 구현`
7. `feat: 메인 보딩 화면 구현`
8. `feat: 컬렉션 콘텐츠와 로그인 진입 화면 구현`
9. `feat: 카카오 로그인 화면 구현`
10. `feat: 회원가입 입력 폼과 검증 구현`
11. `feat: 회원가입 국적 선택 상태 구현`
12. `feat: 상품 목록과 스크롤 상태 구현`
13. `feat: 상품 상세 이미지와 옵션 선택 구현`
14. `feat: 위시리스트와 쇼핑백 추가 기능 구현`
15. `feat: AI 착용 이미지 업로드 화면 구현`
16. `feat: AI 착용 진행 상태와 애니메이션 구현`
17. `feat: 위시리스트 빈 상태와 상품 목록 구현`
18. `feat: 쇼핑백 빈 상태와 상품 관리 구현`
19. `fix: 모바일 브라우저별 레이아웃과 입력 동작 보정`
20. `test: 주요 쇼핑 흐름과 시각 회귀 테스트 추가`
21. `chore: Vercel 배포와 SPA 경로 설정`

화면 하나의 변경량이 커지면 기본 UI, 데이터 상태, 인터랙션을 각각 별도 커밋으로 분리한다. 모든 커밋은 최소한 lint와 build가 통과하는 상태로 유지한다.

## 13. 테스트 및 시각 검증

### 13.1 Figma 시각 검증

각 페이지 및 상태에 대해 다음 순서를 적용한다.

1. 정확한 Figma 노드에서 디자인 컨텍스트 수집
2. 동일 노드의 기준 스크린샷 확보
3. 같은 viewport와 fixture로 구현 화면 캡처
4. Figma 캡처와 overlay 및 이미지 diff 비교
5. 차이를 수정하고 재검증

완료 기준은 다음과 같다.

- 390px 기준 설명되지 않은 시각 차이 0건
- 주요 레이아웃 오차 약 ±1 CSS px 이내
- 이미지 렌더링 노이즈를 제외한 diff 0.5% 이하를 목표로 설정
- 폰트, 줄바꿈, 색상, 간격, 정렬 및 이미지 비율 일치
- 320px부터 430px까지 가로 스크롤과 콘텐츠 잘림 없음

Safari와 WebView는 폰트 안티앨리어싱 차이가 있으므로 픽셀 수치뿐 아니라 실제 배치와 줄바꿈을 우선 판정한다.

### 13.2 기능 테스트

- 메인에서 상품 목록 진입
- 상품 목록에서 상세 진입
- 상품 색상 선택
- 위시리스트 추가 및 제거
- 쇼핑백 추가 및 제거
- 쇼핑백 빈 상태와 채움 상태 전환
- 회원가입 입력 및 국적 선택
- AI 착용 이미지 선택과 진행 상태 전환
- 새로고침 및 직접 URL 접근
- 브라우저 뒤로 가기

### 13.3 오류 및 Mock 상태

모든 API에 대해 다음 fixture를 준비한다.

- 성공
- 빈 데이터
- 지연 응답
- 4xx 오류
- 5xx 오류
- 네트워크 단절

디자인이 없는 오류 상태는 공통 `ErrorState`를 사용하고 후속 컨펌 대상으로 기록한다.

## 14. 접근성 기준

- 목표: WCAG 2.2 AA
- axe critical 및 serious 위반 0건
- 올바른 landmark와 heading 순서
- 입력 요소에 실제 label 제공
- 오류 메시지를 `aria-describedby`로 연결
- 키보드만으로 핵심 흐름 수행 가능
- focus-visible 명확히 표시
- 터치 영역 최소 44×44 CSS px
- 일반 텍스트 명도 대비 4.5:1 이상
- UI 요소 및 큰 텍스트 명도 대비 3:1 이상
- 상태 변화를 색상만으로 표현하지 않음
- 사용자 확대를 차단하지 않음
- `prefers-reduced-motion` 지원

Figma와 접근성 요구사항이 충돌하면 임의로 디자인을 바꾸지 않고 차이와 사유를 기록해 컨펌받는다.

## 15. 성능 목표

Vercel Preview 환경에서 모바일 조건으로 측정한다.

- LCP 2.5초 이하
- INP 200ms 이하
- CLS 0.1 이하
- Lighthouse Performance 90 이상
- Lighthouse Accessibility 및 Best Practices 95 이상
- 초기 JavaScript gzip 200KB 이하를 잠정 목표로 설정
- 초기 화면 전송량 1MB 이하를 잠정 목표로 설정
- 라우트 단위 코드 분할
- 화면 밖 이미지 lazy loading
- LCP 이미지 우선 로딩
- 이미지 크기 및 포맷 최적화
- 폰트 subset과 `font-display` 적용

실제 Figma 이미지와 폰트 파일을 확보한 후 최종 성능 예산을 다시 확정한다.

## 16. Figma 에셋 관리

- Figma MCP가 제공하는 임시 URL을 프로덕션에서 직접 사용하지 않는다.
- 구현 대상 노드의 이미지와 SVG를 로컬 에셋으로 내려받는다.
- 동일한 이미지와 아이콘은 중복 저장하지 않는다.
- 래스터 이미지는 용도에 따라 WebP 또는 AVIF와 fallback을 준비한다.
- SVG는 Figma 원본을 우선 사용하며 임의의 아이콘 패키지를 추가하지 않는다.
- 에셋별 사용 위치, 원본 노드 및 라이선스를 기록한다.
- 임시 placeholder 이미지를 최종 결과물에 남기지 않는다.

## 17. Vercel 배포 계획

- Preview와 Production 환경 변수 분리
- lockfile 기반 clean install 및 build 검증
- React Router 경로의 직접 접근을 위한 SPA rewrite 설정
- HTTPS 및 mixed content 확인
- API CORS 확인
- 정적 에셋 MIME과 캐시 정책 확인
- Preview 배포에서 모든 라우트 smoke test
- Production 배포 후 모바일 실기기 smoke test
- 문제 발생 시 이전 Vercel 배포로 rollback 가능하도록 유지

## 18. 단계별 완료 조건

### 18.1 초기 설정 완료

- 개발 서버 실행
- lint 및 build 통과
- 라우트 기본 진입 가능
- 디자인 토큰과 전역 스타일 적용
- 첫 커밋 완료

### 18.2 페이지 기능 완료

- Figma의 정상, 선택, 빈 데이터 및 로딩 상태 구현
- 콘솔 오류 0건
- 해당 페이지 자동 테스트 통과

### 18.3 시각 완료

- 대표 viewport에서 설명되지 않은 Figma 차이 0건
- 320px부터 430px까지 overflow와 잘림 0건
- 폰트와 에셋 정상 로딩

### 18.4 브라우저 완료

- Chromium 및 WebKit 자동 테스트 통과
- iPhone Safari 실기기 핵심 흐름 통과
- Android Chrome 실기기 핵심 흐름 통과
- 카카오 및 네이버 인앱 브라우저 핵심 흐름 통과

### 18.5 배포 완료

- Vercel Preview에서 전체 라우트와 새로고침 정상
- Production 환경에서 Mock API 비활성화 확인
- 성능 및 접근성 목표 충족
- Production 배포 후 smoke test 통과

## 19. 현재 확인 또는 준비가 필요한 항목

1. `neurimbo_Gothic` 웹폰트 파일과 사용 라이선스
2. Figma 상태바와 홈 인디케이터를 기기 목업으로 제외할지 여부
3. AI 착용 성공 결과, 실패, 취소 및 재시도 화면 디자인
4. 최소 지원 iOS 및 Android 버전
5. 카카오 로그인 실제 연동 방식과 callback API
6. 위시리스트 및 쇼핑백의 비회원 유지 정책
7. 결제하기 버튼이 실제 결제 진입인지 해커톤용 인터랙션인지 여부
8. 추가 애니메이션과 인터랙션에 대한 화면별 컨펌

## 20. 현재 구현 범위에서 제외할 항목

다음 항목은 기존 PRD 및 기능 명세에 포함되어 있으나 현재 Figma 구현 범위에는 없으므로 후속 백로그로 관리한다.

- 취향 설문
- Boarding Pass 발급 및 QR 코드
- 가상 스캔
- 매장 동선 추천과 층별 스토리
- 디지털 Passport
- 방문 스탬프와 히스토리
- 공식 리세일 서비스

해당 기능의 디자인이 추가되면 동일한 Figma 컨텍스트 수집, 구현, 시각 검증 절차를 적용한다.
