# 보딩패스 공통 헤더 라우팅 및 Safe Area 설계

## 1. 목표

보딩패스 8개 화면의 공통 헤더를 앱의 실제 메뉴와 라우터에 연결하고, iPhone 상단 영역을 상태바 UI가 아닌 CSS safe area로 처리한다. 검색 화면은 기획에 없으므로 검색 아이콘을 모든 헤더에서 제거한다.

## 2. 확인된 원인

- `BoardingPassChrome`의 햄버거와 검색 아이콘은 클릭 동작이 없는 `DeferredButton`이다.
- MCM 로고는 링크가 아닌 이미지다.
- 위시리스트와 장바구니는 API 조회 후 빈 목록 토스트만 표시하며, 데이터가 있으면 아무 동작도 하지 않는다.
- 앱 전체의 `StoreMenuProvider`와 `/wishlist`, `/cart` 라우트는 이미 존재하지만 `BoardingPassChrome`이 사용하지 않는다.
- 데스크톱 휴대폰 셸은 `--mcm-safe-top: 44px`을 제공하지만 `BoardingPassChrome`은 이를 사용하지 않아 Dynamic Island와 갈색 타이틀 밴드가 31px 겹친다.

## 3. 공통 헤더 동작

`BoardingPassChrome`이 다음 동작을 직접 소유한다.

| 요소 | 동작 |
| --- | --- |
| 햄버거 | `useStoreMenu()`의 기존 전체 메뉴 열기·닫기 |
| MCM 로고 | `/`로 이동하고 열린 메뉴 닫기 |
| 위시리스트 | `/wishlist`로 이동하고 열린 메뉴 닫기 |
| 장바구니 | `/cart`로 이동하고 열린 메뉴 닫기 |
| 검색 | 화면과 기능이 없으므로 아이콘 자체 제거 |

햄버거에는 일반 `StoreHeader`와 같은 `aria-controls`, `aria-expanded`, 열기·닫기 이름 및 닫힌 뒤 포커스 복원을 적용한다. 새로운 메뉴나 라우팅 추상화는 만들지 않고 기존 `StoreMenuProvider`를 재사용한다.

위시리스트와 장바구니는 빈 상태도 각각의 페이지에서 보여 주는 것이 자연스럽다. 따라서 보딩패스 전용 `useBagHandlers`와 빈 목록 토스트 경로는 삭제하고, 8개 보딩패스 페이지의 hook 호출과 props 전달도 제거한다.

검색 아이콘은 `BoardingPassChrome`과 일반 `StoreHeader` 양쪽에서 제거한다. 사용처가 사라지는 전용 검색 SVG·아이콘 코드·manifest 항목도 함께 정리한다.

## 4. Safe Area 구조

상태바 시간·통신·배터리 UI는 웹 DOM으로 구현하지 않는다.

`BoardingPassChrome`의 바깥 헤더에 다음 구조를 적용한다.

- `padding-top: var(--mcm-safe-top)`
- safe area 배경: `var(--mcm-color-canvas)`
- 내부 타이틀 밴드: 43px
- 내부 아이콘 행: 54px
- `--mcm-header-height`: safe area를 제외한 97px을 그대로 유지

데스크톱 390×844 휴대폰 셸의 목표 좌표는 다음과 같다.

- 흰 safe area: y=0~44
- Dynamic Island: y=11~42
- 갈색 타이틀 밴드: y=44~87
- 흰 아이콘 행: y=87~141
- 전체 메뉴 시작점: `safe area + 97px = 141px`

실제 iOS Safari에서는 `viewport-fit=cover`와 `env(safe-area-inset-top)`을 그대로 사용한다. 노치가 없는 브라우저에서는 safe area가 0이므로 가짜 상단 여백을 만들지 않는다. Dynamic Island DOM은 기존처럼 데스크톱 휴대폰 외형에서만 표시한다.

`LandingPage`와 `PassportPage`의 stage 최소 높이는 `viewport - 97px - safe top`으로 계산해 44px 세로 overflow를 방지한다. 나머지 보딩패스 페이지는 기존 flex 레이아웃이 늘어난 헤더만큼 본문을 자연스럽게 줄인다.

## 5. 범위

영향 화면은 `/boarding-pass/intro`, `/boarding-pass`, `/boarding-pass/survey`, `/boarding-pass/complete`, `/boarding-pass/scan`, `/boarding-pass/flight`, `/boarding-pass/guide`, `/boarding-pass/passport`다.

상품 검색 화면과 검색 API는 만들지 않는다. 위시리스트·장바구니 페이지 내부 데이터 로딩 방식과 로그인 정책도 이번 작업에서 변경하지 않는다.

## 6. 검증

- 실제 앱 라우터로 `/boarding-pass`에서 메뉴 열기·Escape/배경 닫기·포커스 복원을 검증한다.
- 로고, 위시리스트, 장바구니가 각각 `/`, `/wishlist`, `/cart`로 이동하는지 검증한다.
- 일반 헤더와 보딩패스 헤더 모두 검색 컨트롤이 없는지 검증한다.
- 보딩패스 8개 라우트가 동일한 safe-area 헤더를 렌더하는지 smoke test한다.
- 320px, 390px, 430px 모바일 viewport에서 가로 overflow가 없는지 확인한다.
- 1200px 이상 데스크톱 휴대폰 셸에서 타이틀 밴드 top=44px, 아이콘 행 bottom=141px, Dynamic Island와 타이틀 밴드가 겹치지 않는지 실제 브라우저 rect로 검증한다.
- safe top을 0px과 44px로 각각 검사해 노치 없는 브라우저와 iPhone 계열 동작을 모두 확인한다.
- 최종적으로 `npm run verify`를 통과한다.

## 7. 커밋 단위

1. `docs: 보딩패스 헤더 라우팅과 safe area 설계 추가`
2. `feat: 보딩패스 공통 헤더 라우팅 연결`
3. `fix: 보딩패스 상단 safe area 적용`
4. `test: 보딩패스 헤더 통합 동선 검증`

원격 push는 각 커밋의 변경 내용과 메시지를 사용자에게 보고하고 허가받은 뒤에만 수행한다.
