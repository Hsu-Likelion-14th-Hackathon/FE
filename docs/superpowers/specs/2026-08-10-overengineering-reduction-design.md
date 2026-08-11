# 과잉 구현 축소 설계

## 목표

현재 화면의 디자인, 사용자 동작, 접근성, API 전송 형식을 유지하면서 실행에 필요하지 않은 코드와 임시 개발 산출물을 제거한다. 변경 후 제품 코드의 총 줄 수와 의존성 수는 감소해야 한다.

## 유지 조건

- 데스크톱에서 표시되는 휴대폰 프레임, Dynamic Island, 물리 버튼 외형은 기획 디자인이므로 유지한다.
- 320~430px 모바일 화면에서는 기기 외형을 표시하지 않고 기존 safe-area와 viewport 처리를 유지한다.
- `BirthDateField`의 커스텀 달력, `NationalitySelect`의 검색·국기·다국어 표기와 키보드 접근성을 유지한다.
- 스토어 메뉴의 슬라이드 애니메이션, Escape 닫기, 포커스 순환, 배경 닫기, 스크롤 잠금을 유지한다.
- 회원가입 전송값 `birthDate: YYYY-MM-DD`, `nationality: string` 형식을 유지한다.
- Figma에 보이는 텍스트, 이미지, 간격, 색상과 반응형 배치를 변경하지 않는다.

## 축소 범위

### 1. 임시 시각 검증 산출물

- 일회성 CDP 클라이언트인 `.codex-visual-check.mjs`를 제거한다.
- `.codex-edge-profile`, `.codex-edge-shot-desktop`, `.codex-edge-shot-mobile`을 제거한다.
- 반복 가능한 시각 회귀가 필요해지는 시점에만 Playwright 스킬과 `@playwright/test`를 함께 도입한다.

### 2. 회원가입 내부 구현

- 모든 props를 전달하는 단일 호출 구조에 맞춰 `BirthDateField`의 `noop`과 optional 기본 props를 제거한다.
- 정적 국가 데이터와 조회 helper는 현재 계약을 분리하는 경계이므로 그대로 유지한다.
- 런타임이나 생성 스크립트에서 사용하지 않는 `world-countries` devDependency를 제거한다.
- `country-flag-icons`는 실제 UI에서 사용하므로 유지한다.

### 3. 중복 접근성 스타일

- 페이지별 SCSS에 반복된 `.visuallyHidden` 선언을 제거한다.
- 동일한 요소에는 이미 로드된 Tailwind의 `sr-only` 유틸리티를 적용한다.
- 스크린리더 텍스트 자체와 ARIA 속성은 삭제하지 않는다.

### 4. 스토어 메뉴 배선

- 같은 `closeMenu`를 전달하는 `onDismiss`와 `onNavigate`를 `onClose` 하나로 합친다.
- 포커스 가능한 요소가 바뀌어도 접근성이 유지되도록 범용 포커스 선택자와 빈 목록 fallback은 유지한다.
- `StoreMenuProvider`의 location 기반 상태와 Context 경계는 라우트 전환 동작을 보존하기 위해 유지한다.
- 네이티브 `dialog` 전환은 애니메이션과 브라우저별 표현을 바꾸므로 이번 범위에서 제외한다.

### 5. 라우팅과 테스트 전용 코드

- loader, match, 화면 코드에서 사용하지 않는 route `id`를 제거한다.
- 프로덕션에서 읽지 않는 `mcm-boarding-complete` sessionStorage 테스트를 제거한다.
- 테스트만을 위해 스크린리더에 노출한 상품 ID 문구를 제거하고 상품명과 실제 링크 경로로 검증한다.
- 메뉴 테스트는 dialog 출현, 버튼 상태, 포커스 이동과 함께 `data-state`, `aria-hidden`, `inert` 접근성·애니메이션 계약을 유지한다.

### 6. 단일 전달층과 설정 중복

- 한 곳에서만 쓰이며 값이나 동작을 추가하지 않는 `RoutePlaceholder`, `RequiredMark`, `BoardingIntro`, 착용 화면의 로컬 `ProductArtwork`와 submit handler를 호출부에 합친다.
- `CartWishlistTabs`, 상품 조회 helper와 `useStoreMenu`는 UI·도메인·Context 경계를 드러내므로 유지한다.
- Tailwind는 유지하되 실제 사용하는 theme alias만 남기고, 미사용 디자인 토큰과 인접한 중복 SCSS 블록을 제거한다.
- `prettier-plugin-tailwindcss`와 명시적인 ignore 목록은 유지하고, 도구 기본값과 동일한 ESLint·Prettier 설정만 제거한다.
- 동일 30행의 상위 집합인 `_all.csv`를 남기고 카테고리 열만 빠진 API CSV 사본을 제거한다.

## 제외 범위

- 데스크톱 휴대폰 외형 제거 또는 재디자인
- 커스텀 생년월일 입력을 `input[type='date']`로 교체
- 국적 선택을 네이티브 `select`로 교체
- 접근성 키보드 처리, 포커스 복원, ARIA 속성 제거
- 위시리스트와 상품 데이터의 내용 변경
- API 연동, 전역 상태 도입, 신규 화면 구현
- Playwright 및 새로운 런타임 의존성 설치

## 테스트 전략

1. 변경 전 `App`, `SignupPage`, 상품 목록·상세 테스트를 기준선으로 실행한다.
2. MobileShell의 데스크톱 기기 외형 테스트는 유지한다.
3. 회원가입 테스트는 윤년 날짜 선택, 국가 검색·선택, Escape, 포커스 복원, FormData 결과를 검증한다.
4. 메뉴 테스트는 열기·닫기, 배경 닫기, Escape, Tab 순환, 라우트 변경 후 닫힘을 검증한다.
5. 상품 상세 테스트는 테스트 전용 ID 문구 대신 실제 상품명과 착용 링크를 검증한다.
6. 작업 완료 전 `npm run verify`로 ESLint, Prettier, 전체 Vitest, 프로덕션 빌드를 실행한다.

## 완료 조건

- 승인된 유지 조건에 해당하는 DOM과 스타일이 남아 있다.
- 기존 사용자 동작과 API용 폼 값이 유지된다.
- 임시 산출물과 미사용 의존성이 제거된다.
- 변경 diff의 제품 코드 순증가는 0 이하이다.
- 전체 검증 명령이 오류 없이 끝난다.
- 커밋과 푸시는 분리하며, 푸시 전 사용자에게 작업 내용과 커밋 메시지를 보고하고 허가를 받는다.
