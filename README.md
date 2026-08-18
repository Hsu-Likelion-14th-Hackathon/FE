# MCM Boarding Pass Frontend

MCM HAUS 매장 방문을 "비행"에 비유한 모바일 우선 쇼핑 경험입니다. 회원가입으로 여권을
발급받고, 위시리스트·설문으로 탑승권(Boarding Pass)을 발급받아 층별 여행 가이드를 따라
매장을 여행합니다. 방문 기록은 여권에 스탬프로 남고, 크레딧으로 AI 가상 피팅을 쓸 수
있습니다.

주요 화면: 홈 · 상품 목록/상세 · 위시리스트 · 쇼핑백 · 로그인/회원가입(카카오 포함) ·
보딩패스 여정(인트로 → 설문 → 발급 → 스캔 → 비행 → 층별 가이드) · 여권(3D 지면 넘기기) ·
AI 가상 피팅

## 기술 스택

### 런타임 · 프레임워크

| 기술                                    | 버전 | 용도                                                                                                        |
| --------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| [React](https://react.dev)              | 19   | UI. 함수 컴포넌트 + 훅, StrictMode                                                                          |
| [React Router](https://reactrouter.com) | 7    | 라우팅. `createBrowserRouter` + lazy route로 화면별 코드 스플리팅, `ProtectedRoute`로 로그인 보호 구간 관리 |
| [Vite](https://vite.dev)                | 8    | 개발 서버·번들러. dev에서 `/backend` 프록시로 백엔드 CORS 우회(휴대폰 LAN 확인용)                           |

### 스타일

| 기술                                         | 버전 | 용도                                                                        |
| -------------------------------------------- | ---- | --------------------------------------------------------------------------- |
| [Tailwind CSS](https://tailwindcss.com)      | 4    | 레이아웃·간격·반응형 유틸리티 (`@tailwindcss/vite` 플러그인)                |
| [Sass (SCSS Modules)](https://sass-lang.com) | 1.x  | 복잡한 비주얼·컴포넌트 전용 스타일. 디자인 토큰은 `src/styles/_tokens.scss` |

### 도메인 라이브러리

| 기술                                                                       | 버전  | 용도                                                  |
| -------------------------------------------------------------------------- | ----- | ----------------------------------------------------- |
| [three.js](https://threejs.org)                                            | 0.185 | 여권 지면 넘기기 3D 연출 (WebGL 불가 환경은 CSS 폴백) |
| [react-qr-code](https://github.com/rosskhanas/react-qr-code)               | 2     | 보딩패스 QR 코드 렌더                                 |
| [country-flag-icons](https://github.com/catamphetamine/country-flag-icons) | 1     | 국적 선택의 국기 아이콘                               |

### 테스트 · 품질

| 기술                                           | 버전                  | 용도                                                                        |
| ---------------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| [Vitest](https://vitest.dev)                   | 4                     | 테스트 러너 (jsdom 환경). 테스트는 네트워크를 타지 않도록 fetch를 전역 차단 |
| [Testing Library](https://testing-library.com) | React 16 / jest-dom 7 | 접근성 역할 기반 화면 테스트                                                |
| [ESLint](https://eslint.org)                   | 9                     | flat config. `react-hooks`, `jsx-a11y`, `react-refresh` 플러그인            |
| [Prettier](https://prettier.io)                | 3                     | 포맷. `prettier-plugin-tailwindcss`로 클래스 정렬                           |

### 백엔드 연동

- REST API — 라이브 Swagger(`/swagger-ui`)가 계약 기준. 공통 응답 래퍼
  `{ isSuccess, code, message, result }`는 `src/shared/api/client.js`가 해석
- 인증: JWT Bearer (sessionStorage 보관) + 카카오 OAuth 인가 코드 교환
- 이미지 업로드: 백엔드가 발급한 SAS URL로 Azure Blob에 직접 PUT
- 도메인별 API 모듈: `src/shared/api/*Api.js` (auth · product · wishlist ·
  shoppingBag · boardingPass · floor · passport · fitting)

## 요구 환경

- Node.js 22.12.0 이상
- npm 10 이상

## 실행

```bash
npm install
cp .env.example .env.local   # 백엔드 주소·카카오 키 설정 (파일 안 주석 참고)
npm run dev
```

`VITE_`로 시작하는 환경 변수는 브라우저 번들에 공개됩니다. 비밀 키나 서버 전용 인증 정보는
`.env` 파일에 넣지 않습니다. (카카오 REST API 키는 OAuth `client_id`로 쓰이는 공개 값이라
번들에 들어가도 됩니다 — 비밀 키는 백엔드만 갖습니다.)

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
  app/        라우터·프로바이더·보호 라우트(ProtectedRoute)
  pages/      화면 단위 (home, product-*, cart, wishlist, login, signup,
              boarding-pass/*, try-on, ...)
  features/   화면을 가로지르는 도메인 조각 (보딩패스 티켓·토스트 등)
  entities/   도메인 상태 훅 (useSession, usePassport)
  shared/
    api/      백엔드 클라이언트·도메인 API·토큰/플래그 저장소
    layout/   공용 레이아웃 (헤더, 보딩패스 무대, 스텝 내비)
    ui/       공용 컴포넌트 (StateNotice, 토스트, 입력 가드 등)
    lib/      순수 유틸 (비밀번호 규칙, 여권 표기명)
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
