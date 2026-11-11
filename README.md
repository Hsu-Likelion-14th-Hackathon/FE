<!-- ===================================================== -->
<!--                     PROJECT HEADER                    -->
<!-- ===================================================== -->

<h1 align="center">MCM Boarding Pass</h1>

<p align="center">
  <b>온라인의 취향이 오프라인의 여정이 되는, MCM HAUS 브랜드 경험 플랫폼</b><br/>
  위시리스트가 탑승권이 되고, 매장 방문이 한 번의 비행이 되는 모바일 웹 서비스
</p>

<p align="center">
  <a href="https://boardingpass-seven.vercel.app"><img src="https://img.shields.io/badge/%EB%B0%94%EB%A1%9C%20%EC%8D%A8%EB%B3%B4%EA%B8%B0-boardingpass--seven.vercel.app-C07346?style=flat-square&logo=vercel&logoColor=white"/></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/three.js-0.185-000000?style=flat-square&logo=threedotjs&logoColor=white"/>
</p>

<p align="center">
  한성대학교 멋쟁이사자처럼 14기 해커톤 · 팀 <code>감자탕에감자없음</code>
</p>

---

## 목차

**누구나 읽을 수 있는 소개**

1. [MCM Boarding Pass는 어떤 서비스인가요?](#about)
2. [바로 써보기](#try)
3. [이용 흐름](#flow)
4. [주요 기능](#features)
5. [이렇게 빨라졌어요](#results)
6. [어떤 휴대폰에서도 잘 보여요](#devices)
7. [사용한 기술](#tech-stack)
8. [팀](#team)

**개발자를 위한 안내**

9. [내 컴퓨터에서 실행하기](#getting-started)
10. [환경변수](#env)
11. [데모(목 서버) 모드](#mock-mode)
12. [폴더 구조](#structure)
13. [화면 주소](#routing)
14. [서버와 통신하는 방법](#api)
15. [검증](#verify)
16. [배포](#deploy)
17. [모바일 대응](#mobile)
18. [성능 개선 자세히 보기](#performance)
19. [스타일링 원칙](#style)
20. [용어 풀이](#glossary)

---

<a id="about"></a>

## MCM Boarding Pass는 어떤 서비스인가요?

> MCM 매장 방문을 한 번의 비행처럼 꾸민 모바일 웹 서비스입니다.

온라인에서 마음에 들어 담아 둔 상품이 매장으로 떠나는 **탑승권**이 되고, 매장에서 그 탑승권을 스캔하면
층마다 무엇을 보면 좋을지 알려 주는 **여행 가이드**가 열립니다.

- 마음에 드는 상품을 위시리스트에 담고, 짧은 취향 설문에 답하면 나만의 탑승권이 발급돼요.
- 매장 입구에서 탑승권을 스캔하면 층별 가이드와 음성 해설이 시작돼요.
- 매장을 다 둘러보면 방문 기록이 실제처럼 넘겨 보는 **3D 디지털 여권**에 스탬프로 남아요.
- 사진 한 장으로 상품을 입어 보는 **AI 가상 피팅**도 할 수 있어요.

휴대폰에 맞춰 만든 웹사이트라 앱을 설치하지 않고 브라우저에서 바로 쓸 수 있습니다.

---

<a id="try"></a>

## 바로 써보기

> 사이트에 들어가 로그인 버튼만 누르면 체험용 계정으로 바로 둘러볼 수 있습니다.

<p align="center">
  <a href="https://boardingpass-seven.vercel.app">
    <img src="https://img.shields.io/badge/MCM%20Boarding%20Pass-%EB%B0%94%EB%A1%9C%20%EC%8D%A8%EB%B3%B4%EA%B8%B0-C07346?style=for-the-badge&logo=vercel&logoColor=white"/>
  </a>
</p>

<p align="center">
  <sub>휴대폰으로 여는 것을 권장합니다 · 컴퓨터에서는 휴대폰 모양 틀 안에 표시됩니다</sub>
</p>

| 순서 | 할 일                                                                           |
| :--: | ------------------------------------------------------------------------------- |
|  1   | 홈에서 **Boarding** 버튼을 누릅니다                                             |
|  2   | **비행 시작하기**를 누르면 로그인 화면이 나옵니다                               |
|  3   | **체험용 데모 모드** 안내가 보이면 아무것도 입력하지 않고 **로그인**만 누릅니다 |

> 서버에 연결되지 않을 때는 사이트가 자동으로 **체험용 데모 모드**로 바뀝니다. 미리 준비된 예시 데이터로
> 모든 화면이 동작하고, 담은 상품이나 발급한 탑승권은 내 브라우저에만 남아 탭을 닫으면 처음으로 돌아갑니다.

---

<a id="flow"></a>

## 이용 흐름

> 담기 → 설문 → 스캔 → 기록, 네 단계로 매장을 여행합니다.

| 단계 | 사용자가 하는 일                             | 화면에서 일어나는 일                            |
| :--: | -------------------------------------------- | ----------------------------------------------- |
|  1   | 마음에 드는 상품을 **위시리스트**에 담습니다 | 담은 상품이 내 취향 정보가 됩니다               |
|  2   | 짧은 **취향 설문**에 답합니다                | 취향에 맞춘 **탑승권(보딩패스)** 이 발급됩니다  |
|  3   | 매장 입구에서 탑승권을 **스캔**합니다        | 층별 **여행 가이드**와 음성 해설이 열립니다     |
|  4   | 매장을 둘러보고 **비행을 마칩니다**          | 방문 기록이 **디지털 여권**에 스탬프로 남습니다 |

---

<a id="features"></a>

## 주요 기능

> 실제처럼 넘겨 보는 3D 여권, 매장에서 스캔하는 탑승권, 층마다 들려주는 음성 해설, 사진으로 입어 보는 AI 피팅이 핵심입니다.

| 기능                 | 할 수 있는 일                                                                  |
| -------------------- | ------------------------------------------------------------------------------ |
| **보딩패스(탑승권)** | 취향 설문을 마치면 발급되고, 매장에서 QR로 스캔해 여행을 시작                  |
| **층별 여행 가이드** | 층마다 볼거리와 추천 상품을 안내. AI가 추천한 층을 먼저 보여 줌                |
| **음성 도슨트**      | 층을 옮기면 그 층의 해설로 바뀌고, 재생 속도를 1 → 1.25 → 1.5 → 2배로 조절     |
| **3D 디지털 여권**   | 종이가 휘며 넘어가는 여권에 방문 스탬프와 여행 기록이 쌓임                     |
| **AI 가상 피팅**     | 전신 사진을 올리면 상품을 입힌 모습을 만들어 줌. 실패하면 쓴 크레딧을 돌려받음 |
| **쇼핑**             | 상품 목록·상세, 위시리스트, 쇼핑백                                             |
| **로그인**           | 이메일 또는 카카오 계정으로 로그인. 서버가 멈추면 체험용 데모 모드             |

<details>
<summary>기능별로 어떻게 만들었는지 보기</summary>

### 3D 여권

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

### 보딩패스 티켓

발급된 패스 코드를 QR로 실어 매장에서 스캔합니다.
티켓 카드는 발급 시점 데이터를 그대로 받아 그리므로, 이후 찜을 취소해도 내용이 변하지 않습니다.

### 음성 도슨트

`GET /floors`가 주는 `audioUrl`을 받아 층 해설을 재생합니다.
층이 바뀌면 이전 층의 음성을 멈추고 새 음원으로 교체합니다.

재생 속도는 눌러서 순환합니다 — `1 → 1.25 → 1.5 → 2`.
아직 음원이 등록되지 않은 화면에서는 재생·정지 상태만 표현합니다.
디자인에 있는 버튼이라 감추지 않습니다.

### AI 가상 피팅

```
업로드 URL 발급 → Azure Blob 직접 PUT → 세션 생성(PENDING · 크레딧 차감)
                                              ↓ 2초 간격 폴링
                        DONE     결과 이미지
                        FAILED   차감 크레딧 자동 환급 안내 후 업로드 화면 복귀
```

생성 응답이 곧장 `FAILED`로 오면 폴링이 걸리지 않아 로딩 화면에 갇히므로,
그 자리에서 바로 접습니다.

### 국적 선택

249개국을 현지 이름과 영문 이름으로 검색합니다.
한국·일본·미국·중국·프랑스·독일 여섯 나라는 목록 맨 위에 고정했습니다 —
알파벳순으로 249개를 훑게 두면 대한민국을 고르는 데도 한참 걸립니다.
검색을 시작하면 이 구분은 사라지고 결과만 남습니다.

</details>

---

<a id="results"></a>

## 이렇게 빨라졌어요

> 이미지와 글꼴을 가볍게 만들고 받는 순서를 바꿔, 첫 화면의 주요 내용이 1.4~1.9초 빨리 보이게 했습니다.

처음에는 화면을 넘길 때마다 그림이 위에서부터 늦게 그려지고, 첫 화면이 무거웠습니다.
원인을 하나씩 측정하고 고쳐서 아래처럼 개선했습니다.

**내려받는 용량이 크게 줄었어요**

| 항목                               | 개선 전 |                 개선 후 |
| ---------------------------------- | ------: | ----------------------: |
| 화면 이미지 36장                   |  22.3MB | **1.9MB** (약 12분의 1) |
| 처음 방문할 때 받는 전체 파일 (홈) | 1,629KB |             **1,246KB** |
| 글꼴 (홈)                          |   791KB |               **370KB** |
| 국적 선택을 열 때 받는 파일        |    48KB |                 **1KB** |

**첫 화면이 더 빨리 떠요** (구글 Lighthouse로 휴대폰 환경을 흉내 내 3번 측정한 중앙값)

| 화면          | 첫 화면의 주요 내용이 보이기까지 |
| ------------- | -------------------------------- |
| 홈            | 8.1초 → **6.7초**                |
| 로그인        | 6.4초 → **4.8초**                |
| 보딩패스 소개 | 7.2초 → **5.3초**                |

구글은 "주요 내용이 보이기까지 2.5초 이내"를 좋은 기준으로 봅니다. 아직 그 기준에는 못 미쳐 계속 줄여 가는 중이며,
실제 사용자 기기에서의 속도는 **Vercel Speed Insights**로 확인하고 있습니다.

어떻게 고쳤는지는 [성능 개선 자세히 보기](#performance)에 정리했습니다.

---

<a id="devices"></a>

## 어떤 휴대폰에서도 잘 보여요

> 카카오톡으로 링크를 열어도, 아이폰 사파리에서도 화면이 잘리지 않고 글자를 읽기 편하게 맞췄습니다.

- **카카오톡·인스타그램 앱 안에서 열어도** 아래 버튼이 앱의 막대에 가리지 않아요. 실제로 보이는 화면 높이를 재서 맞춥니다.
- **화면이 짧은 휴대폰**에서는 여백과 그림을 비율대로 줄여 버튼까지 한 화면에 들어오게 했어요. 큰 화면에서는 디자인 그대로입니다.
- **아이폰에서 입력칸을 눌러도** 화면이 확대된 채 남지 않아요. 손가락으로 확대하는 기능은 그대로입니다.
- **가장 작은 글자를 12px**로 맞췄어요. 애플·구글의 모바일 가이드(최소 11pt·11sp)를 참고하고, 획이 많은 한글을 위해 1px 더 키웠습니다.
- 한글 낱말이 줄 끝에서 쪼개지지 않게 **띄어쓰기에서만 줄을 바꿔요.**

자세한 내용은 [모바일 대응](#mobile)에 있습니다.

---

<a id="tech-stack"></a>

## 사용한 기술

> 화면은 React로 만들고, 3D 여권은 three.js로 그리며, Vercel로 인터넷에 올립니다.

### Frontend

<p>
  <img src="https://skillicons.dev/icons?i=react,vite,js,html,css,sass,tailwind"/>
</p>

<p>
  <img src="https://img.shields.io/badge/React%20Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white"/>
  <img src="https://img.shields.io/badge/react--qr--code-2-191919?style=flat-square"/>
</p>

### 3D · Graphics

<p>
  <img src="https://skillicons.dev/icons?i=threejs"/>
</p>

### Deploy · Monitoring

<p>
  <img src="https://skillicons.dev/icons?i=vercel"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Vercel-Speed%20Insights-000000?style=flat-square&logo=vercel&logoColor=white"/>
  <img src="https://img.shields.io/badge/Lighthouse-%EC%84%B1%EB%8A%A5%20%EC%B8%A1%EC%A0%95-F44B21?style=flat-square&logo=lighthouse&logoColor=white"/>
</p>

### Testing · Code Quality

<p>
  <img src="https://skillicons.dev/icons?i=vitest"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Testing%20Library-16-E33332?style=flat-square&logo=testinglibrary&logoColor=white"/>
  <img src="https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier&logoColor=black"/>
</p>

### Tools

<p>
  <img src="https://skillicons.dev/icons?i=git,github,figma,notion"/>
</p>

<details>
<summary>각 기술이 하는 일 보기</summary>

| 기술                     | 하는 일                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| React 19                 | 화면을 부품(컴포넌트)처럼 나눠 만드는 도구                          |
| React Router 7           | 주소(`/boarding-pass`, `/products` 등)에 맞는 화면을 보여 주는 도구 |
| Vite 8                   | 만든 코드를 웹사이트용 파일로 묶어 주는 도구                        |
| Tailwind CSS 4 · Sass    | 화면 디자인(색, 크기, 배치)을 작성하는 도구                         |
| three.js                 | 3D 여권의 종이 넘김을 그리는 3D 그래픽 도구                         |
| react-qr-code            | 탑승권의 QR 코드를 그리는 도구                                      |
| Vercel                   | 웹사이트를 인터넷에 올려 누구나 접속할 수 있게 해 주는 서비스       |
| Vercel Speed Insights    | 실제 방문자 기기에서 체감 속도를 모아 보여 주는 도구                |
| Lighthouse               | 구글이 만든 웹사이트 속도 측정 도구                                 |
| Vitest · Testing Library | 화면과 기능이 의도대로 동작하는지 자동으로 확인하는 테스트 도구     |
| ESLint · Prettier        | 코드 실수를 잡고 모양을 일정하게 맞추는 도구                        |
| Git · GitHub             | 코드 변경 기록을 남기고 팀원과 함께 관리하는 도구                   |
| Figma · Notion           | 화면 디자인 시안과 API 명세·회의 기록을 함께 보는 도구              |

</details>

<details>
<summary>버전과 라이브러리 자세히 보기</summary>

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
| **Monitoring**  | Vercel Speed Insights (실사용자 Core Web Vitals)                      |

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

</details>

---

<a id="team"></a>

## 팀

| Product Manager         | Designer     | FrontEnd        | FrontEnd   | BackEnd                           | BackEnd                  |
| ----------------------- | ------------ | --------------- | ---------- | --------------------------------- | ------------------------ |
| **임연주**              | **최소영**   | **김헌영**      | **김성빈** | **박세웅**                        | **신채희**               |
| 기획 · 리서치 발표 피칭 | UX/UI 디자인 | 프론트엔드 총괄 | 프론트엔드 | 보딩패스 · AI 동선 도슨트 · Azure | 인증 · 상품 AI 가상 피팅 |

**1976년 뮌헨에서 태어난 이름 하나가, 2026년 다시 같은 질문을 던집니다.**

---

<br/>

<a id="getting-started"></a>

## 내 컴퓨터에서 실행하기

> 코드를 내려받은 뒤 명령어 몇 줄로 내 컴퓨터에서 사이트를 띄워 볼 수 있습니다. ([Node.js](https://nodejs.org) 22.12 이상 필요)

<details>
<summary>자세히 보기</summary>

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

| 명령어            | 하는 일                                         |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | 개발용 서버 실행 (코드를 고치면 바로 반영)      |
| `npm run build`   | 실제 배포용 파일 만들기 (`dist/` 폴더)          |
| `npm run preview` | 배포용 파일을 내 컴퓨터에서 미리 확인           |
| `npm run verify`  | 코드 검사 · 모양 검사 · 테스트 · 빌드를 한 번에 |

### 휴대폰 실기기 확인

개발 서버는 LAN에 열려 있습니다(`host: true`). 터미널의 Network 주소를 휴대폰에서 열면 됩니다.

다만 휴대폰의 origin(`http://<PC IP>:5173`)은 백엔드 CORS 허용 목록에 없어 직접 호출이 막힙니다.
`.env.local`에 `VITE_API_BASE_URL=/backend`를 두면 개발 서버가 대신 전달해 same-origin으로 만듭니다.

`/backend` 접두사를 두는 이유가 있습니다. `/products`처럼 **앱 라우트와 이름이 겹치는 API 경로**가
있어서, 경로를 그대로 프록시하면 새로고침이 화면 대신 백엔드 JSON을 받습니다.

카카오 로그인만은 PC에서 확인합니다. LAN IP origin은 카카오 콘솔에 등록돼 있지 않아 `KOE006`이 납니다.

</details>

---

<a id="env"></a>

## 환경변수

> 서버 주소처럼 환경마다 달라지는 설정값입니다. 코드에 직접 적지 않고 `.env.local`이나 Vercel 설정에 넣습니다.

<details>
<summary>자세히 보기</summary>

| 변수                   | 용도                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | 백엔드 호스트. 개발에서 `/backend`를 쓰면 Vite 프록시를 경유합니다              |
| `VITE_KAKAO_CLIENT_ID` | 카카오 REST API 키. OAuth `client_id`로 쓰는 공개 값이라 번들에 들어가도 됩니다 |
| `VITE_API_MOCK`        | 목 폴백 — `fallback`(기본, 백엔드에 닿지 못할 때만) · `always` · `off`          |

`.env.example`에는 `VITE_APP_ORIGIN`도 있지만 **프론트 코드는 읽지 않습니다.**
백엔드 CORS 허용 Origin을 등록할 때 참고하는 값입니다.

`VITE_`로 시작하는 값은 브라우저 번들에 공개됩니다. 비밀 키는 넣지 않습니다.

</details>

---

<a id="mock-mode"></a>

## 데모(목 서버) 모드

> 서버에 연결되지 않아도 브라우저 안의 가짜 서버가 대신 응답해, 모든 화면을 체험할 수 있게 하는 모드입니다.

<details>
<summary>자세히 보기</summary>

- `apiFetch`가 백엔드에 닿지 못하면(네트워크 실패·첫 응답 6초 무응답·502/503/504) 브라우저 안의 목 서버(`src/shared/api/mock/`)가 같은 경로·같은 응답 래퍼로 대신 응답한다. 한 번 실패하면 5분 동안 바로 목을 쓴다
- 목 서버 코드는 폴백에 들어설 때만 동적으로 받는다
- `probeBackend`가 `no-cors` HEAD로 연결만 확인하고, `useBackendOffline` 훅이 로그인 화면에 상태를 알린다
- `VITE_API_MOCK` = `fallback`(기본) · `always`(항상 목, 시연용) · `off`
- 로그인 화면에 "체험용 데모 모드" 안내가 보이고, 로그인 버튼만 누르면 데모 계정(`guest@mcm.demo`)으로 들어갑니다.
- 데이터는 `sessionStorage`에 저장되어 새로고침해도 남고, 탭을 닫으면 처음으로 돌아갑니다.

</details>

---

<a id="structure"></a>

## 폴더 구조

> 코드가 역할별로 어느 폴더에 들어 있는지 정리한 지도입니다.

<details>
<summary>자세히 보기</summary>

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

</details>

---

<a id="routing"></a>

## 화면 주소

> 각 화면이 어떤 주소로 열리는지, 어떤 화면이 로그인을 요구하는지 정리했습니다.

<details>
<summary>자세히 보기</summary>

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

</details>

---

<a id="api"></a>

## 서버와 통신하는 방법

> 모든 서버 요청은 한 곳(`apiFetch`)을 거칩니다. 응답 형식 풀기, 로그인 토큰 붙이기, 서버가 멈췄을 때 데모 모드로 바꾸기를 여기서 맡습니다.

<details>
<summary>자세히 보기</summary>

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

</details>

---

<a id="verify"></a>

## 검증

> 코드를 올리기 전에 코드 검사, 모양 검사, 자동 테스트, 배포용 빌드를 모두 통과시킵니다.

<details>
<summary>자세히 보기</summary>

```bash
npm run lint         # ESLint — 경고 0 기준(--max-warnings=0)
npm run format:check # Prettier
npm run test:run     # Vitest
npm run build        # 프로덕션 번들
npm run verify       # 위 넷을 한 번에
```

현재 **테스트 49파일 · 390개**가 통과합니다.

테스트는 네트워크를 타지 않습니다. 셋업이 `fetch`를 전역에서 거부하도록 덮어,
`.env`가 있는 로컬과 없는 CI의 결과가 갈리지 않게 맞춥니다.
특정 응답이 필요한 테스트는 자기 파일에서 `vi.stubGlobal('fetch', ...)`로 덮어씁니다.

매 테스트는 로그인하지 않은 상태에서 시작합니다. 앞선 테스트가 남긴 토큰이 다음 테스트의
초기 세션이 되면 화면마다 세션 복원이 돌아 타이밍에 민감한 테스트가 흔들립니다.

jsdom에 없는 `ResizeObserver`는 셋업이 대역을 심고, `triggerResize()`로 직접 깨웁니다.

</details>

---

<a id="deploy"></a>

## 배포

> GitHub의 `main` 브랜치에 코드가 합쳐지면 Vercel이 자동으로 사이트를 새로 만들어 올립니다.

<details>
<summary>자세히 보기</summary>

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

</details>

---

<a id="mobile"></a>

## 모바일 대응

> 휴대폰 크기나 브라우저(사파리, 카카오톡 등)가 달라도 화면이 깨지지 않고 읽기 편하도록 한 부분입니다.

<details>
<summary>자세히 보기</summary>

- `src/shared/layout/browserViewport.js` — 인앱 브라우저(UA)면 `innerHeight`를 `--mcm-app-height`로 넣고 `html[data-inapp]`에서 화면 높이로 사용. WKWebView는 `lvh`·`dvh`를 잘못 계산하는 일이 잦다([WebKit 255852](https://bugs.webkit.org/show_bug.cgi?id=255852)). iOS에서만 viewport에 `maximum-scale=1`(입력칸 자동 확대만 막고 핀치 줌은 유지)
- 랜딩·인트로는 `--mcm-design-height(844)`보다 짧은 만큼에 비례해 여백·이미지를 줄인다. 844 이상이면 0이라 Figma 그대로
- 글자 하한은 `--mcm-font-min` 토큰과 `font-size: max(var(--mcm-font-min), <Figma 값>)`. 여권 지면은 3D 캔버스 글자와 크기를 맞춰야 해서 제외
- 본문에 `word-break: keep-all` + `overflow-wrap: break-word`

</details>

---

<a id="performance"></a>

## 성능 개선 자세히 보기

> 느렸던 원인을 측정 도구로 찾아내고, 이미지·글꼴·코드를 가볍게 만들고, 필요한 것부터 먼저 받도록 바꿨습니다. 결과 요약은 [이렇게 빨라졌어요](#results)에 있습니다.

<details>
<summary>자세히 보기</summary>

### 이미지 용량 — 21.9MB → 1.8MB

화면은 390px 폭인데 원본 PNG를 그대로 쓰고 있었습니다. 2048×2048(2.3MB) 비행기,
3.0MB 상품 사진 같은 파일이 화면을 넘길 때마다 위에서부터 늦게 그려졌습니다.

- 1MB 안팎의 PNG 21장과 base64 PNG를 감싼 SVG 1장을 **WebP로 전환**했습니다.
- 폭은 **최대 1170px(390px 프레임의 3배)** 로 줄였습니다. dpr 3 기기에서도 화질 손실이 없는 상한입니다.
- 원본 대비 PSNR 43~48dB, 평균 색 차이 0.3 이내로 **보이는 디자인은 그대로**입니다.
- 22장 합계 **21.9MB → 1.8MB (−92%)**. 여권 내지·스탬프도 같은 방식으로 WebP로 바꿨습니다.
- 이어서 장식·티켓·여권 소품 PNG 14장도 WebP로 바꿔 **449KB → 115KB**로 줄였습니다.
  바코드는 막대 가장자리가 무르면 안 되어 무손실로 저장했습니다.

### 다음 화면 미리 받기

화면은 넘어가야 그 화면의 JS를 받고, 렌더된 뒤에야 이미지를 요청했습니다.
넘길 때마다 청크 → 렌더 → 이미지가 순서대로 이어져 이미지가 늦게 떴습니다.

- 보딩패스 여정은 순서가 정해져 있습니다(랜딩 → 인트로 → 설문 → 발급 → 스캔 → 비행 → 가이드).
  브라우저가 한가해지면(`requestIdleCallback`) **다음 화면의 모듈과 첫 화면 배경·히어로 이미지**를
  낮은 우선순위로 미리 받습니다(`useRoutePrefetch`).
- 라우터와 미리 받기가 같은 로더(`routeModules.js`)를 써서, 넘어갈 때 lazy가 기다리지 않고 바로 풀립니다.
- 여권의 three.js는 여정 끝(비행·가이드)에서만 받습니다. 랜딩에서 모두에게 받게 하지 않습니다.
- 데이터 절약 모드와 2G에서는 미리 받지 않습니다.

### 필요한 코드만 받기

- **전 화면을 lazy route로 나눴습니다.** three.js를 쓰는 여권 화면(약 560KB)은 별도 청크라,
  여권에 들어가지 않는 사용자는 내려받지 않습니다.
- 여권 편집 시트의 생년월일 스피너·국적 선택(249개국 데이터)도 `React.lazy`로 미뤘습니다.
  시트를 열 때 처음 받습니다.
- **국기는 보이는 것만 받습니다.** 국기 라이브러리 CSS는 267개국을 data URI로 한 파일에 담아
  gzip으로도 48KB였습니다. 낱장 SVG를 `<img loading="lazy">`로 그려 국적 화면이 **48KB → 1KB**(CSS)가 됐습니다.
- **목 서버는 필요할 때만 받습니다.** 백엔드가 정상이어도 모든 사용자가 목 데이터를 메인 번들로 받고
  있었습니다. 폴백에 들어설 때 동적으로 불러와 첫 화면 JS가 gzip 5KB 줄었습니다.
- 도슨트 음성은 `preload="none"` — 재생을 누르기 전에는 음원을 받지 않습니다.
- 목록 이미지는 `decoding="async"`, 위시리스트·쇼핑백은 `loading="lazy"`를 붙여
  화면 밖 이미지가 첫 렌더를 막지 않게 했습니다.

### 폰트

- Pretendard는 저작자가 배포하는 **동적 서브셋**(굵기마다 92개 묶음 + `unicode-range`)을 씁니다.
  화면에 실제로 나온 글자가 든 묶음만 받아, 굵기마다 260KB 파일을 통째로 받던 때보다 첫 로딩이 가볍습니다.
  저작자 배포 파일 그대로라 OFL 예약 글꼴 이름(Pretendard)을 지키고, 한글 11,172자를 모두 덮습니다.
- 대가로 묶음이 도착할 때마다 다시 배치해, Lighthouse TBT가 80~220ms 늘었습니다(LCP·전송량 이득이 더 큼).
- 브랜드 글꼴(느림보고딕)은 라이선스상 변환·서브셋이 금지라 원본 OTF를 그대로 `preload`합니다.
- `font-display: swap`으로 폰트를 기다리느라 글자가 비어 보이지 않게 했습니다.

### 캐시

- 이름에 내용 해시가 붙은 `/assets/*`는 `Cache-Control: public, max-age=31536000, immutable`(`vercel.json`).
  이전에는 `max-age=0`이라 다시 방문할 때마다 파일 수십 개를 서버에 확인했습니다.
- 메뉴 카드 사진(약 130KB)은 메뉴를 처음 열 때, 또는 화면이 다 뜬 뒤 한가할 때 받습니다.

### 측정

- **실험실** — Lighthouse 13 모바일(느린 4G · CPU 4배), 실서버 영향을 빼려고 목을 켠 운영 빌드에서 화면마다 3회 중앙값.
- **실사용자** — `@vercel/speed-insights`. 라우트는 주소가 아니라 패턴(`/products/:productId`)으로 보내 화면 단위로 모읍니다.
  배포 빌드에서만 켜며, Vercel 대시보드에서 Speed Insights를 켜야 수집됩니다(Hobby 무료 등급).

### 3D 여권 렌더링

- **이미지를 한 번만 받습니다.** 에셋 로딩이 단계(step)에 묶여 있어 장을 넘길 때마다
  이미지 14장을 다시 받고 디코딩했습니다. 최초 1회만 받고, 지면을 굽는 일과 각도만 바꿔
  다시 그리는 일을 분리했습니다.
- **프레임마다 캔버스 버퍼를 다시 잡지 않습니다.** 넘김 애니메이션 매 프레임에 `setSize`가 돌아
  버퍼를 새로 할당하고 있었습니다. 크기는 `ResizeObserver`에서만 맞추고, 프레임에서는
  각도와 렌더만 합니다.
- **텍스처 해상도를 지면 크기에 맞춥니다.** 고정 2배 대신 지면이 실제로 차지하는 픽셀을 재서
  배수를 정합니다(상한 4, 메모리 보호). 배수는 0.5 단위로 끊어 **바뀔 때만 다시 굽습니다** —
  창을 조금 흔드는 정도로는 다시 굽지 않습니다.
- **폰트를 기다리되 무한정 기다리지 않습니다.** 캔버스 글자는 CSS와 달리 나중에 다시 그려지지
  않아 폰트 도착 전에 구우면 대체 글꼴로 굳습니다. 1.5초까지만 기다리고, 그 뒤에 도착한
  경우에만 한 번 다시 굽습니다.

### 백엔드가 응답하지 않을 때

서버가 꺼져 있으면 요청이 수십 초씩 매달려 화면이 멈춘 것처럼 보였습니다.

- 백엔드가 살아 있는지 아직 모를 때는 **6초 안에 응답이 없으면 끊습니다.**
  한 번이라도 응답을 받으면 타임아웃을 걸지 않아 AI 발급·피팅처럼 오래 걸리는 요청은 지킵니다.
- 한 번 닿지 못하면 **5분 동안은 기다리지 않고 바로** 브라우저 안의 목 응답으로 화면을 그립니다.
  시간이 지나면 다시 실서버를 시도합니다(`VITE_API_MOCK`).

</details>

---

<a id="style"></a>

## 스타일링 원칙

> 디자인 값은 Figma 시안을 기준으로 하고, 레이아웃은 Tailwind, 복잡한 꾸밈은 SCSS로 나눠 씁니다.

<details>
<summary>자세히 보기</summary>

- Tailwind CSS는 레이아웃·간격·반응형 유틸리티에 씁니다.
- SCSS Modules는 복잡한 비주얼과 컴포넌트 전용 스타일에 씁니다.
- Tailwind와 Sass를 같은 파일의 전처리 과정에 섞지 않습니다.
- 디자인 값은 **Figma가 기준**입니다. 명암비·미사용 같은 이유로 임의 변경하지 않습니다.

### Figma

- [와이어프레임](https://www.figma.com/design/nPoHrwxi0e0738SWNzN7rN/%EB%A9%8B%EC%82%AC-14%EA%B8%B0-%EC%A4%91%EC%95%99%ED%86%A4--%EB%B3%B5%EC%82%AC-?node-id=0-1)
- [디자인](https://www.figma.com/design/nPoHrwxi0e0738SWNzN7rN/%EB%A9%8B%EC%82%AC-14%EA%B8%B0-%EC%A4%91%EC%95%99%ED%86%A4--%EB%B3%B5%EC%82%AC-?node-id=1-2)

**백엔드 저장소** — [Hsu-Likelion-14th-Hackathon/BE](https://github.com/Hsu-Likelion-14th-Hackathon/BE)

</details>

---

<a id="glossary"></a>

## 용어 풀이

> 이 문서에 나오는 낯선 용어를 한 줄씩 풀어 둔 사전입니다.

| 용어                           | 뜻                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| 보딩패스                       | 비행기 탑승권. 이 서비스에서는 취향 설문으로 발급받아 매장에서 스캔하는 화면 속 탑승권 |
| 도슨트                         | 전시를 설명해 주는 안내인. 여기서는 층마다 해설을 들려주는 음성 기능                   |
| LCP (Largest Contentful Paint) | 화면에서 가장 큰 요소(그림, 제목 등)가 다 보이기까지 걸린 시간. 2.5초 이내면 좋음      |
| TBT (Total Blocking Time)      | 화면이 뜨는 동안 조작해도 반응하지 못하고 멈춰 있던 시간의 합                          |
| CLS (Cumulative Layout Shift)  | 화면이 뜨는 동안 내용이 갑자기 밀리는 정도. 낮을수록 좋음                              |
| Core Web Vitals                | 구글이 정한 웹사이트 사용자 경험 핵심 지표                                             |
| Lighthouse                     | 구글이 만든 웹사이트 속도·품질 측정 도구                                               |
| WebP                           | 같은 품질에서 PNG·JPG보다 훨씬 가벼운 이미지 형식                                      |
| 인앱 브라우저                  | 카카오톡·인스타그램처럼 앱 안에서 링크를 열 때 뜨는 브라우저                           |
| 목(mock) 서버                  | 실제 서버 대신 미리 준비한 예시 데이터로 응답하는 가짜 서버                            |
| 배포                           | 만든 코드를 인터넷에 올려 누구나 접속할 수 있게 하는 것                                |
| 캐시                           | 한 번 받은 파일을 저장해 두고 다음에 다시 받지 않는 것                                 |
