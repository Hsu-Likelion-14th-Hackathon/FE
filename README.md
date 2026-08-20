# ✈️ MCM Boarding Pass — Frontend

### 온라인의 취향이 오프라인의 여정이 되는, MCM HAUS 브랜드 경험 플랫폼

매장 방문을 한 번의 비행으로 옮긴 모바일 우선 웹 앱입니다.

위시리스트가 한 장의 보딩패스가 되고, 매장에서 스캔하는 순간 층별 여행 가이드가 열립니다.

비행이 끝나면 그 기록은 3D로 넘겨 보는 디지털 여권에 스탬프로 남습니다.

React 19
React Router 7
Vite 8
Tailwind CSS 4
Sass
three.js
Vitest

**한성대학교 멋쟁이사자처럼 14기 해커톤** · 팀 `감자탕에감자없음`

## 목차

- [화면 흐름](#화면-흐름)
- [주요 구현](#주요-구현)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [백엔드 연동](#백엔드-연동)
- [로컬 실행](#로컬-실행)
- [검증](#검증)
- [배포](#배포)
- [스타일링 원칙](#스타일링-원칙)
- [문서](#문서)
- [팀](#팀)

## 화면 흐름

```
                        공개 구간
  ┌──────────────────────────────────────────────────┐
  │  /                        홈                     │
  │  /boarding-pass           보딩패스 랜딩          │
  │  /login · /signup         로그인 · 회원가입      │
  │  /auth/kakao/callback     카카오 인가 코드 콜백  │
  └──────────────────────┬───────────────────────────┘
                         │  ProtectedRoute
  ┌──────────────────────▼───────────────────────────┐
  │                  로그인 보호 구간                │
  │                                                  │
  │  커머스   /products · /products/:productId       │
  │          /products/:productId/try-on   AI 피팅   │
  │          /wishlist · /cart                       │
  │                                                  │
  │  여정     /boarding-pass/intro      인트로       │
  │              ↓ survey              취향 설문     │
  │              ↓ complete            보딩패스 발급 │
  │              ↓ scan                매장 QR 스캔  │
  │              ↓ flight              비행 · 동선   │
  │              ↓ guide               층별 가이드   │
  │                                                  │
  │  기록     /boarding-pass/passport   3D 여권      │
  └──────────────────────────────────────────────────┘
```

보호 구간은 **토큰 유무에 더해 프로필(여권 정보) 미완성 여부**까지 봅니다.
가입 1단계만 마쳤거나 카카오 신규 가입 뒤 추가 정보를 쓰지 않고 이탈한 사용자는
가입 2단계로 돌려보냅니다. 두 판별 모두 저장소 표시를 읽으므로 서버 왕복이 없습니다.

홈과 랜딩은 정적 무대라 공개로 둡니다. 버튼을 눌러 보호 구간에 들어서는 순간
로그인으로 보내고, 마치면 원래 자리로 돌아옵니다.

## 주요 구현

### 🛂 3D 여권

여권을 실제로 넘기는 화면입니다. three.js로 책과 지면을 세우고,
지면 내용은 **캔버스에 구워 `CanvasTexture`로 입힙니다.**

```
passportPageTexture   지면 4종(표지 · 신분면 · 스탬프 · 여행기록)을 캔버스에 그림
        ↓ CanvasTexture
paperMaterial         종이 재질 — 앞뒤 다른 텍스처, 비침 보정
        ↓
passportSheetScene    낱장 한 장의 휘어짐과 넘김
passportBookScene     펼친 책의 양면 배치
```

WebGL 컨텍스트를 만들지 못하는 환경과 `prefers-reduced-motion` 설정에서는
**DOM 폴백으로 즉시 넘어갑니다.** 3D가 안 되는 기기에서도 여권은 열립니다.

방문 스탬프는 3열 2행 여섯 칸이 설계된 전부입니다. 서버가 최신순으로 주는 목록에서
앞의 여섯 개를 그리므로, 방문이 쌓이면 오래된 스탬프가 지면에서 밀려납니다.

### 🎫 보딩패스 티켓

발급된 패스 코드를 QR로 실어 매장에서 스캔합니다.
티켓 카드는 발급 시점 데이터를 그대로 받아 그리므로, 이후 찜을 취소해도 내용이 변하지 않습니다.

### 🔊 음성 도슨트

`GET /floors`가 주는 `audioUrl`을 받아 층 해설을 재생합니다.
층이 바뀌면 이전 층의 음성을 멈추고 새 음원으로 교체합니다.

재생 속도는 눌러서 순환합니다 — `1 → 1.25 → 1.5 → 2`.
아직 음원이 등록되지 않은 화면에서는 재생·정지 상태만 표현합니다.
디자인에 있는 버튼이라 감추지 않습니다.

### 👗 AI 가상 피팅

```
업로드 URL 발급 → Azure Blob 직접 PUT → 세션 생성(PENDING · 크레딧 차감)
                                              ↓ 2초 간격 폴링
                        DONE     결과 이미지
                        FAILED   차감 크레딧 자동 환급 안내 후 업로드 화면 복귀
```

생성 응답이 곧장 `FAILED`로 오면 폴링이 걸리지 않아 로딩 화면에 갇히므로,
그 자리에서 바로 접습니다.

### 🌏 국적 선택

249개국을 현지 이름과 영문 이름으로 검색합니다.
한국·일본·미국·중국·프랑스·독일 여섯 나라는 목록 맨 위에 고정했습니다 —
알파벳순으로 249개를 훑게 두면 대한민국을 고르는 데도 한참 걸립니다.
검색을 시작하면 이 구분은 사라지고 결과만 남습니다.

## 기술 스택

| 구분            | 사용 기술                                                             |
| --------------- | --------------------------------------------------------------------- |
| **Language**    | JavaScript (ES Modules)                                               |
| **UI**          | React 19, React Router 7 (`createBrowserRouter` · 전 화면 lazy route) |
| **Build**       | Vite 8, `@vitejs/plugin-react`                                        |
| **Style**       | Tailwind CSS 4 (`@tailwindcss/vite`), Sass 1.x (SCSS Modules)         |
| **3D**          | three.js 0.185                                                        |
| **Auth**        | JWT Bearer, Kakao OAuth 2.0                                           |
| **Test**        | Vitest 4 (jsdom), Testing Library (React 16 · jest-dom 7)             |
| **Lint/Format** | ESLint 9 (flat config), Prettier 3 + `prettier-plugin-tailwindcss`    |
| **Deploy**      | Vercel                                                                |

**그 밖의 라이브러리**

| 라이브러리                                                                   | 쓰임                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [react-qr-code](https://github.com/rosskhanas/react-qr-code) 2               | 보딩패스 티켓의 패스 코드 QR                                          |
| [country-flag-icons](https://gitlab.com/catamphetamine/country-flag-icons) 1 | 국적 선택의 **국기 이미지** (CSS 스프라이트)                          |
| [world-countries](https://github.com/mledoze/countries) 5.1.0                | 국적 선택의 **국가 데이터 249개**. 필요한 필드만 추출해 저장소에 포함 |

국가 목록과 국기는 출처가 다릅니다. 이름·ISO 코드 같은 데이터는 `world-countries`에서
가져와 `src/shared/ui/profile-fields/country-options.js`에 넣었고, 국기 그림만
`country-flag-icons`가 담당합니다. `world-countries`는 ODbL-1.0이라 귀속이 필요합니다 —
[서드파티 고지](./docs/third-party-notices.md)를 참고하세요.

**React 19 · StrictMode** — 개발 모드의 이중 효과 실행을 견디도록 씁니다.
카카오 인가 코드는 한 번만 교환할 수 있어, 콜백 화면이 `useRef` 가드로 1회 소비를 보장합니다.

**three.js를 고른 이유** — 여권 넘김은 종이의 휘어짐과 앞뒤 비침이 있어야 여권처럼 보입니다.
CSS 3D 변환으로는 지면이 평평한 판으로 접히고, 지면마다 다른 내용을 텍스처로 갈아 끼울
방법도 마땅치 않았습니다.

## 프로젝트 구조

```
src/
  app/        라우터(lazy route) · 프로바이더 · ProtectedRoute
  pages/      화면 단위
              home · product-list · product-detail · try-on · wishlist · cart
              login · signup · auth(카카오 콜백) · not-found
              boarding-pass/ landing · intro · survey · complete
                             scan · flight · guide · passport
  features/   보딩패스 도메인 조각
              boarding-ticket(QR) · travel-guide · issue-loading · scan-loading
              loading-ring · empty-bag · no-pass · credit · save-pass · notice 토스트
  entities/   도메인 상태 훅
              session(세션 복원 · 프로필 동기화) · passport(여권 조회 · missing/error 분기)
  shared/
    api/      apiFetch · endpoints · 도메인 API 8종 · storedValue · kakaoAuth
    layout/   StoreHeader/StoreMenu · 보딩패스 무대 · 스텝 내비 · 뷰포트 유틸
    ui/       도슨트 · 토스트 · StateNotice · 공백 가드 · 프로필 입력 필드 · 상품 카드
    lib/      순수 유틸 — 비밀번호 규칙 · 여권 표기명 필터
    assets/   보딩패스 전용 이미지
  assets/     폰트 · 아이콘 · 이미지
  styles/     전역 스타일 · 디자인 토큰(_tokens.scss) · 브레이크포인트
  test/       Vitest 셋업
```

화면 코드와 나란히 `*.test.jsx`를 둡니다. 테스트만 모은 디렉터리는 없습니다.

## 백엔드 연동

**계약 기준은 라이브 Swagger입니다.** 경로에 `/api` 접두사가 없고,
모든 응답이 공통 래퍼를 씁니다.

```json
{ "isSuccess": true, "code": "COMMON2000", "message": "성공입니다.", "result": {} }
```

래퍼 해석은 `src/shared/api/client.js`의 `apiFetch` **한 곳**이 맡습니다.
모듈마다 벗기면 한 곳만 빠뜨려도 화면이 래퍼를 직접 들여다보게 됩니다.

| 옵션             | 동작                                         |
| ---------------- | -------------------------------------------- |
| `unwrap`         | 성공 응답에서 `result`만 반환                |
| `notFoundAsNull` | 404를 오류 대신 `null`로 — 빈 상태로 그릴 때 |
| 401 응답         | 죽은 토큰을 지워 다음 요청이 다시 쓰지 않게  |

**도메인 모듈** — `auth` · `product` · `wishlist` · `shoppingBag` · `boardingPass` ·
`floor` · `passport` · `fitting` (`src/shared/api/*Api.js`)

**세션** — 토큰과 프로필 미완성 표시는 `createStoredValue` 팩토리로 만든 sessionStorage
저장소에 삽니다. 새로고침에는 살아남고 탭을 닫으면 사라집니다. 구독으로 화면과 동기화합니다.

**카카오 로그인** — 인가 URL을 직접 구성합니다(`kakaoAuth.js`). `state`로 CSRF를 대조하고,
redirect URI는 `window.location.origin`에서 만듭니다. 카카오를 거치면 페이지가 통째로
새로 뜨므로 **돌아올 자리는 sessionStorage로 잇습니다** — 라우터 state로는 들고 갈 수 없습니다.

**이미지 업로드** — 백엔드가 발급한 SAS URL로 Azure Blob에 직접 PUT 합니다.
`x-ms-blob-type: BlockBlob` 헤더가 없으면 거부됩니다.

**층별 가이드 상품** — 백엔드가 층 콘텐츠에 `PRODUCT` 블록을 연결할 여유가 없어(2026-08-18 합의),
프론트가 층에 맞는 상품을 직접 조회해 콘텐츠 끝에 잇습니다. 열쇠는 층 번호가 아니라 `code`입니다 —
층 번호는 한 차례 재정렬된 적이 있어 번호에 매면 그때마다 깨집니다.
서버가 `PRODUCT` 블록을 주기 시작하면 그 블록을 그대로 쓰고 덧붙이지 않습니다.

## 로컬 실행

### 요구사항

- Node.js 22.12.0 이상
- npm 10 이상

### 실행

```bash
# 1. 저장소 클론
git clone https://github.com/Hsu-Likelion-14th-Hackathon/FE.git
cd FE

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.example의 주석을 읽고 값을 채워주세요

# 4. 개발 서버 실행
npm run dev
```

### 환경 변수

| 변수                   | 용도                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | 백엔드 호스트. 개발에서 `/backend`를 쓰면 Vite 프록시를 경유합니다              |
| `VITE_KAKAO_CLIENT_ID` | 카카오 REST API 키. OAuth `client_id`로 쓰는 공개 값이라 번들에 들어가도 됩니다 |

`.env.example`에는 `VITE_APP_ORIGIN`도 있지만 **프론트 코드는 읽지 않습니다.**
백엔드 CORS 허용 Origin을 등록할 때 참고하는 값입니다.

`VITE_`로 시작하는 값은 브라우저 번들에 공개됩니다. 비밀 키는 넣지 않습니다.

### 휴대폰 실기기 확인

개발 서버는 LAN에 열려 있습니다(`host: true`). 터미널의 Network 주소를 휴대폰에서 열면 됩니다.

다만 휴대폰의 origin(`http://<PC IP>:5173`)은 백엔드 CORS 허용 목록에 없어 직접 호출이 막힙니다.
`.env.local`에 `VITE_API_BASE_URL=/backend`를 두면 개발 서버가 대신 전달해 same-origin으로 만듭니다.

`/backend` 접두사를 두는 이유가 있습니다. `/products`처럼 **앱 라우트와 이름이 겹치는 API 경로**가
있어서, 경로를 그대로 프록시하면 새로고침이 화면 대신 백엔드 JSON을 받습니다.

카카오 로그인만은 PC에서 확인합니다. LAN IP origin은 카카오 콘솔에 등록돼 있지 않아 `KOE006`이 납니다.

## 검증

```bash
npm run lint         # ESLint — 경고 0 기준(--max-warnings=0)
npm run format:check # Prettier
npm run test:run     # Vitest
npm run build        # 프로덕션 번들
npm run verify       # 위 넷을 한 번에
```

현재 **테스트 44파일 · 368개**가 통과합니다.

테스트는 네트워크를 타지 않습니다. 셋업이 `fetch`를 전역에서 거부하도록 덮어,
`.env`가 있는 로컬과 없는 CI의 결과가 갈리지 않게 맞춥니다.
특정 응답이 필요한 테스트는 자기 파일에서 `vi.stubGlobal('fetch', ...)`로 덮어씁니다.

매 테스트는 로그인하지 않은 상태에서 시작합니다. 앞선 테스트가 남긴 토큰이 다음 테스트의
초기 세션이 되면 화면마다 세션 복원이 돌아 타이밍에 민감한 테스트가 흔들립니다.

jsdom에 없는 `ResizeObserver`는 셋업이 대역을 심고, `triggerResize()`로 직접 깨웁니다.

## 배포

`main` 브랜치 푸시 시 Vercel이 자동 배포합니다.

```
push main
   │
   ├─ Vercel Git 연동이 커밋 감지
   ├─ npm ci → vite build
   ├─ dist/ 정적 호스팅 (vercel.json이 모든 경로를 /index.html로 rewrite)
   └─ Production 도메인 갱신
```

SPA rewrite가 필요한 이유는 `createBrowserRouter`를 쓰기 때문입니다.
rewrite가 없으면 `/boarding-pass/passport`를 새로고침할 때 404가 납니다.

| 항목              | 값                                                                     |
| ----------------- | ---------------------------------------------------------------------- |
| Production        | [boardingpass-seven.vercel.app](https://boardingpass-seven.vercel.app) |
| Production Branch | `main`                                                                 |
| Backend           | `https://boardingpass.p-e.kr`                                          |

`main`이 아닌 브랜치와 PR은 Preview 배포를 따로 받습니다.

전 화면이 lazy route라 화면별로 청크가 나뉩니다. 여권 화면은 three.js를 물고 있어
따로 떨어져 있고, 여권에 들어가지 않는 사용자는 내려받지 않습니다.

## 스타일링 원칙

- Tailwind CSS는 레이아웃·간격·반응형 유틸리티에 씁니다.
- SCSS Modules는 복잡한 비주얼과 컴포넌트 전용 스타일에 씁니다.
- Tailwind와 Sass를 같은 파일의 전처리 과정에 섞지 않습니다.
- 디자인 값은 **Figma가 기준**입니다. 명암비·미사용 같은 이유로 임의 변경하지 않습니다.

### Figma

- [와이어프레임](https://www.figma.com/design/nPoHrwxi0e0738SWNzN7rN/%EB%A9%8B%EC%82%AC-14%EA%B8%B0-%EC%A4%91%EC%95%99%ED%86%A4--%EB%B3%B5%EC%82%AC-?node-id=0-1)
- [디자인](https://www.figma.com/design/nPoHrwxi0e0738SWNzN7rN/%EB%A9%8B%EC%82%AC-14%EA%B8%B0-%EC%A4%91%EC%95%99%ED%86%A4--%EB%B3%B5%EC%82%AC-?node-id=1-2)

## 문서

- [프론트엔드 개발 계획](./docs/frontend-development-plan.md)
- [API 연동 계획](./docs/api-integration-plan.md) · [연동 백로그](./docs/api-integration-backlog.md)
- [API 명세 모음](./docs/api/) — 노션에서 내보낸 엔드포인트별 문서
- [서드파티 고지](./docs/third-party-notices.md)

**백엔드 저장소** — [Hsu-Likelion-14th-Hackathon/BE](https://github.com/Hsu-Likelion-14th-Hackathon/BE)

## 팀

| Product Manager         | Designer     | FrontEnd        | FrontEnd   | BackEnd                           | BackEnd                  |
| ----------------------- | ------------ | --------------- | ---------- | --------------------------------- | ------------------------ |
| **임연주**              | **최소영**   | **김헌영**      | **김성빈** | **박세웅**                        | **신채희**               |
| 기획 · 리서치 발표 피칭 | UX/UI 디자인 | 프론트엔드 총괄 | 프론트엔드 | 보딩패스 · AI 동선 도슨트 · Azure | 인증 · 상품 AI 가상 피팅 |

**1976년 뮌헨에서 태어난 이름 하나가, 2026년 다시 같은 질문을 던집니다.**
