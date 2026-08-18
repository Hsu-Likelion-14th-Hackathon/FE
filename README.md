# MCM Boarding Pass Frontend

MCM HAUS 매장 방문을 "비행"에 비유한 모바일 우선 쇼핑 경험입니다. 회원가입으로 여권을
만들고, 위시리스트와 설문으로 탑승권(Boarding Pass)을 발급받아 AI 추천 동선을 따라 층별
여행 가이드로 매장을 여행합니다. 방문 기록은 여권에 스탬프로 남고, 크레딧으로 AI 가상
피팅을 쓸 수 있습니다.

## 화면 흐름 (라우트)

```
/                                홈 (공개)
/login · /signup                 로그인 · 회원가입(이메일 2단계, 카카오 합류)
/auth/kakao/callback             카카오 인가 코드 콜백
/boarding-pass                   보딩패스 랜딩 (공개)
── 로그인 보호 구간 (ProtectedRoute) ──
/products · /products/:id        상품 목록 · 상세
/products/:id/try-on             AI 가상 피팅
/wishlist · /cart                위시리스트 · 쇼핑백
/boarding-pass/intro → survey → complete → scan → flight → guide
                                 인트로 → 설문 → 발급 → 스캔 → 비행 → 층별 가이드
/boarding-pass/passport          여권 (3D 지면 넘기기)
```

보호 구간은 토큰 유무에 더해 **프로필(여권 정보) 미완성 여부**까지 본다 — 가입 1단계나
카카오 신규 가입 뒤 추가 정보를 쓰지 않고 이탈한 사용자는 가입 2단계로 돌려보낸다.

## 기술 스택

### 런타임 · 프레임워크

| 기술                                    | 버전 | 이 프로젝트에서의 실제 사용                                                                                                                                 |
| --------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [React](https://react.dev)              | 19   | 전 화면. 함수 컴포넌트 + 훅, StrictMode(이중 효과를 견디는 코드 — 카카오 code 1회 소비 가드 등)                                                             |
| [React Router](https://reactrouter.com) | 7    | `createBrowserRouter` + 전 화면 lazy route(화면별 청크 분리). `ProtectedRoute`가 토큰·프로필 미완성 가드. 카카오 왕복의 복귀 경로는 sessionStorage로 잇는다 |
| [Vite](https://vite.dev)                | 8    | 개발 서버·번들러. dev는 LAN에 열고(`host: true`) `/backend` 프록시로 백엔드 CORS를 우회해 휴대폰 실기기 확인을 지원                                         |

### 스타일

| 기술                                         | 버전 | 실제 사용                                                                                               |
| -------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| [Tailwind CSS](https://tailwindcss.com)      | 4    | 레이아웃·간격·반응형 유틸리티 (`@tailwindcss/vite` 플러그인, Prettier 클래스 정렬)                      |
| [Sass (SCSS Modules)](https://sass-lang.com) | 1.x  | 화면 전용 비주얼의 대부분. 페이지·컴포넌트마다 `*.module.scss`, 디자인 토큰은 `src/styles/_tokens.scss` |

### 도메인 라이브러리

| 기술                                                                       | 버전  | 실제 사용                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [three.js](https://threejs.org)                                            | 0.185 | 여권 화면의 3D 책·지면 넘김(`passportBookScene` · `passportSheetScene` · `paperMaterial`). 지면 내용은 캔버스에 구워 `CanvasTexture`로 입힌다(`passportPageTexture`). WebGL을 못 만드는 환경은 DOM 폴백으로 즉시 넘김 |
| [react-qr-code](https://github.com/rosskhanas/react-qr-code)               | 2     | 보딩패스 티켓 카드(`BoardingTicketCard`)의 패스 코드 QR                                                                                                                                                               |
| [country-flag-icons](https://gitlab.com/catamphetamine/country-flag-icons) | 1     | 국적 선택(`NationalitySelect`)의 국기 — 249개국 검색 목록                                                                                                                                                             |

### 테스트 · 품질

| 기술                                           | 버전                  | 실제 사용                                                                                                                                     |
| ---------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [Vitest](https://vitest.dev)                   | 4                     | 테스트 42파일 · 360개 (jsdom). 셋업에서 fetch를 전역 차단해 테스트가 네트워크를 타지 않고, sessionStorage 초기화·ResizeObserver 대역을 심는다 |
| [Testing Library](https://testing-library.com) | React 16 / jest-dom 7 | 접근성 역할(role·label) 기반 화면 테스트                                                                                                      |
| [ESLint](https://eslint.org)                   | 9                     | flat config. `react-hooks` · `jsx-a11y` · `react-refresh`, 경고 0 기준(`--max-warnings=0`)                                                    |
| [Prettier](https://prettier.io)                | 3                     | 포맷 + `prettier-plugin-tailwindcss`                                                                                                          |

### 백엔드 연동 방식

- **계약 기준은 라이브 Swagger.** 경로에 `/api` 접두사가 없고, 모든 응답이
  `{ isSuccess, code, message, result }` 래퍼를 쓴다 — 해석은 `src/shared/api/client.js`의
  `apiFetch` 한 곳이 맡는다 (401이면 토큰 자동 정리, `notFoundAsNull` 등)
- **인증**: JWT Bearer. 토큰과 프로필 미완성 표시는 `createStoredValue` 팩토리로 만든
  sessionStorage 저장소에 살고(새로고침 유지, 탭 닫으면 소멸), 구독으로 화면과 동기화
- **카카오 로그인**: 인가 URL 직접 구성(`kakaoAuth.js`) — state로 CSRF 대조, redirect URI는
  origin에서 생성. code는 백엔드 `POST /auth/kakao`로 교환
- **이미지 업로드**: 백엔드가 발급한 SAS URL로 Azure Blob에 직접 PUT (피팅·기본 전신 이미지)
- **AI 피팅**: 세션 생성 후 2초 폴링. FAILED면 크레딧 자동 환급 안내와 함께 업로드 화면 복귀
- **층별 가이드 상품**: 서버 콘텐츠에 PRODUCT 블록이 없는 동안 프론트가 층 테마별 상품을
  직접 조회해 잇는다(`floorApi.js`) — 서버가 블록을 주기 시작하면 자동으로 그쪽을 쓴다
- 도메인별 모듈: `auth` · `product` · `wishlist` · `shoppingBag` · `boardingPass` · `floor` ·
  `passport` · `fitting` (`src/shared/api/*Api.js`)

## 요구 환경

- Node.js 22.12.0 이상
- npm 10 이상

## 실행

```bash
npm install
cp .env.example .env.local   # 파일 안 주석 참고
npm run dev
```

코드가 읽는 환경 변수는 두 개다:

| 변수                   | 용도                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | 백엔드 호스트. dev에서 `/backend`를 쓰면 Vite 프록시를 경유한다                                             |
| `VITE_KAKAO_CLIENT_ID` | 카카오 REST API 키. OAuth `client_id`로 쓰이는 공개 값이라 번들에 들어가도 된다 — 비밀 키는 백엔드만 갖는다 |

`VITE_`로 시작하는 값은 브라우저 번들에 공개되므로 비밀 키는 `.env`에 넣지 않는다.

## 검증 명령

```bash
npm run lint
npm run test:run
npm run build
npm run verify     # lint + format:check + test + build 한 번에
```

## 프로젝트 구조

```
src/
  app/        라우터(lazy route)·프로바이더·ProtectedRoute
  pages/      화면 단위 — home, product-list/detail, try-on, wishlist, cart,
              login, signup, auth(카카오 콜백), boarding-pass/(landing·intro·
              survey·complete·scan·flight·guide·passport), not-found
  features/   보딩패스 도메인 조각 — boarding-ticket(QR), travel-guide,
              issue/scan-loading, empty-bag·no-pass·credit·save-pass 토스트
  entities/   도메인 상태 훅 — useSession(세션 복원·프로필 동기화),
              usePassport(여권 조회·missing/error 분기)
  shared/
    api/      apiFetch·endpoints·도메인 API·storedValue(토큰/플래그)·kakaoAuth
    layout/   StoreHeader/StoreMenu, 보딩패스 무대·스텝 내비, 뷰포트 유틸
    ui/       StateNotice, 토스트, 공백 가드(useSpaceGuard), 프로필 입력 필드,
              상품 카드, 도슨트(UI 목)
    lib/      순수 유틸 — 비밀번호 규칙, 여권 표기명 필터
  styles/     전역 스타일·디자인 토큰
```

## 스타일링 원칙

- Tailwind CSS는 레이아웃, 간격, 반응형 유틸리티에 사용합니다.
- SCSS Modules는 복잡한 비주얼과 컴포넌트 전용 스타일에 사용합니다.
- Tailwind와 Sass를 같은 파일의 전처리 과정에 섞지 않습니다.
- 디자인 값은 Figma가 기준입니다. 명암비·미사용 같은 이유로 임의 변경하지 않습니다.

## Figma

- [와프](https://www.figma.com/design/nPoHrwxi0e0738SWNzN7rN/%EB%A9%8B%EC%82%AC-14%EA%B8%B0-%EC%A4%91%EC%95%99%ED%86%A4--%EB%B3%B5%EC%82%AC-?node-id=0-1)
- [디자인](https://www.figma.com/design/nPoHrwxi0e0738SWNzN7rN/%EB%A9%8B%EC%82%AC-14%EA%B8%B0-%EC%A4%91%EC%95%99%ED%86%A4--%EB%B3%B5%EC%82%AC-?node-id=1-2)

## 문서

- [프론트엔드 개발 계획](./docs/frontend-development-plan.md)
- [API 연동 계획](./docs/api-integration-plan.md) · [연동 백로그](./docs/api-integration-backlog.md)
- [API 명세 모음](./docs/api/) — 노션에서 내보낸 엔드포인트별 문서
- [서드파티 고지](./docs/third-party-notices.md)
