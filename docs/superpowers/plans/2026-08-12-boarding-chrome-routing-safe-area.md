# Boarding Pass Chrome Routing and Safe Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task with TDD and per-task review.

**Goal:** 보딩패스 8개 화면의 공통 헤더를 기존 전체 메뉴와 실제 앱 라우트에 연결하고, 기획에 없는 검색 아이콘을 제거하며, iPhone 상단 영역을 상태 표시줄 DOM이 아닌 CSS safe area로 처리한다.

**Architecture:** `BoardingPassChrome`이 기존 `StoreMenuProvider`를 직접 소비하고 메뉴·로고·위시리스트·쇼핑백 동작을 소유한다. 위시리스트와 쇼핑백의 빈 상태는 각 목적 페이지가 책임지므로 보딩패스 전용 API 선조회·토스트 계층은 삭제한다. safe area는 공통 Chrome의 바깥 흰 여백으로 한 번만 적용하고, `--mcm-header-height: 97px`는 safe area를 제외한 콘텐츠 높이로 유지한다.

**Tech Stack:** React 19, React Router 7, JavaScript, SCSS Modules, Vitest, Testing Library, Vite 8, 기존 Microsoft Edge(CDP 검증 전용)

## Global Constraints

- 검색 화면과 검색 API가 없으므로 검색 아이콘은 일반 `StoreHeader`와 `BoardingPassChrome`에서 모두 제거한다. 대체 라우트를 만들지 않는다.
- 보딩패스 헤더는 새 메뉴를 만들지 않고 기존 `StoreMenuProvider`와 `StoreMenu`를 재사용한다.
- 메뉴 버튼은 `aria-controls="store-menu"`, `aria-expanded`, `메뉴 열기/닫기` 이름과 닫힘 후 포커스 복원을 유지한다.
- MCM 로고는 `/`, 위시리스트는 `/wishlist`, 쇼핑백은 `/cart`로 직접 이동하고 열린 메뉴를 닫는다.
- 상태 표시줄·시계·통신·배터리·Dynamic Island를 모바일 페이지 DOM으로 구현하지 않는다. 데스크톱 `MobileShell`의 기존 Dynamic Island 표현만 유지한다.
- `--mcm-header-height`는 43px 타이틀 밴드와 54px 아이콘 행의 합인 97px로 유지하며 safe top을 포함시키지 않는다.
- 실제 iOS는 `env(safe-area-inset-top)`을 사용하고, inset이 0인 브라우저에는 가짜 44px 여백을 만들지 않는다.
- 기준 Figma viewport는 `390×844`, 반응형 검증 폭은 `320`, `390`, `430px`다.
- 새 npm 의존성, 전역 상태, 검색 페이지, API/MSW endpoint를 추가하지 않는다.
- 새 조작 요소는 최소 `44×44px`이며 기존 키보드·포커스·Escape 동작을 보존한다.
- 커밋은 최소 기능 단위로 나누고 `<tag>: <한글 메시지>` 형식을 사용한다.
- 원격 push는 커밋·작업 내용·메시지를 사용자에게 보고하고 허가받은 뒤에만 수행한다.

---

### Task 1: 공통 헤더 라우팅과 검색 제거

**Files:**
- Modify: `src/shared/layout/BoardingPassChrome.jsx`
- Modify: `src/shared/layout/BoardingPassChrome.module.scss`
- Modify: `src/shared/layout/BoardingPassChrome.test.jsx`
- Modify: `src/shared/layout/store-header/StoreHeader.jsx`
- Modify: `src/shared/ui/icons/StoreIcons.jsx`
- Modify: `src/shared/assets/boarding-pass/assets-manifest.md`
- Delete: `src/shared/assets/boarding-pass/icons/search.svg`
- Delete: `src/features/boarding-pass/empty-bag-toast/useBagHandlers.jsx`
- Delete: `src/features/boarding-pass/empty-bag-toast/EmptyBagToast.jsx`
- Modify: `src/pages/boarding-pass/intro/IntroPage.jsx`
- Modify: `src/pages/boarding-pass/landing/LandingPage.jsx`
- Modify: `src/pages/boarding-pass/survey/SurveyPage.jsx`
- Modify: `src/pages/boarding-pass/complete/CompletePage.jsx`
- Modify: `src/pages/boarding-pass/scan/ScanPage.jsx`
- Modify: `src/pages/boarding-pass/flight/FlightPage.jsx`
- Modify: `src/pages/boarding-pass/guide/GuidePage.jsx`
- Modify: `src/pages/boarding-pass/passport/PassportPage.jsx`
- Modify: `src/pages/boarding-pass/landing/LandingPage.test.jsx`
- Modify: `src/pages/boarding-pass/flight/FlightPage.test.jsx`
- Modify: `src/pages/boarding-pass/passport/PassportPage.test.jsx`
- Modify: `src/app/App.test.jsx`

**Interfaces:**
- Consumes: `useStoreMenu()`의 `isOpen`, `toggleMenu`, `closeMenu`
- Produces: 보딩패스 Chrome의 실제 menu button과 `/`, `/wishlist`, `/cart` 링크
- Removes: `BoardingPassChrome({ onWishlistClick, onCartClick })`, `useBagHandlers()`, 보딩패스 빈 가방 토스트, 두 헤더의 검색 glyph

- [ ] **Step 1: 실제 앱 경계의 실패 테스트를 먼저 작성한다**

`src/app/App.test.jsx`의 기존 `renderRoute()`를 재사용해 다음 사용자 동작을 검증한다.

```jsx
it('보딩패스 Chrome 메뉴를 Escape로 닫으면 트리거에 포커스를 복원한다', async () => {
  renderRoute('/boarding-pass')
  const menuButton = await screen.findByRole('button', { name: '메뉴 열기' })

  fireEvent.click(menuButton)
  expect(screen.getByRole('dialog', { name: '전체 메뉴' })).toBeInTheDocument()

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
  expect(menuButton).toHaveFocus()
})
```

로고·위시리스트·쇼핑백은 각각 독립된 `it.each` 사례로 `/`, `/wishlist`, `/cart` 이동과 목적 화면 heading을 검증한다. 각 사례는 새 router를 사용한다. 헤더를 시각적으로 바꾸는 검색 제거는 `/`의 일반 헤더 SVG 수가 5개에서 4개, `/boarding-pass`의 Chrome 이미지 수가 5개에서 4개가 되는 실제 렌더 결과로 검증한다.

`src/shared/layout/BoardingPassChrome.test.jsx`는 `MemoryRouter`로 감싸고, 메뉴·로고·위시리스트·쇼핑백의 각 조작 영역이 `2.75rem`인지 확인한다.

- [ ] **Step 2: RED를 확인한다**

```powershell
npm.cmd run test:run -- src/app/App.test.jsx src/shared/layout/BoardingPassChrome.test.jsx
```

Expected: 현재 Chrome에 `메뉴 열기` 버튼과 세 링크가 없고 검색 glyph가 남아 있어 새 테스트가 FAIL한다.

- [ ] **Step 3: `BoardingPassChrome`을 기존 메뉴와 라우터에 연결한다**

```jsx
const { isOpen, toggleMenu, closeMenu } = useStoreMenu()
const menuButtonRef = useRef(null)
const wasMenuOpenRef = useRef(isOpen)

useEffect(() => {
  if (wasMenuOpenRef.current && !isOpen) {
    menuButtonRef.current?.focus({ preventScroll: true })
  }

  wasMenuOpenRef.current = isOpen
}, [isOpen])

<button
  ref={menuButtonRef}
  type="button"
  aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
  aria-controls="store-menu"
  aria-expanded={isOpen}
  onClick={toggleMenu}
  className={styles.iconAction}
>
  <img src={menuIcon} alt="" className={styles.menuIcon} />
</button>

<Link to="/" aria-label="MCM 메인" onClick={closeMenu} className={styles.logoLink}>
  <img src={wordmarkLogo} alt="" className={styles.wordmark} />
</Link>
```

위시리스트와 쇼핑백도 같은 방식의 `Link`로 구현한다. `StoreHeader`의 기존 메뉴 포커스 복원 패턴을 그대로 사용하고 별도 hook이나 헤더 추상화를 만들지 않는다. `StoreMenuContext`는 기본 no-op 값을 제공하므로 isolated page test에는 새 Provider를 추가하지 않고, 실제 메뉴 동작은 `App.test.jsx`의 `StoreMenuProvider` 경계에서 검증한다.

- [ ] **Step 4: 검색과 더 이상 사용하지 않는 가방 선조회 계층을 삭제한다**

두 헤더에서 검색 import와 JSX를 제거하고 `SearchIcon`, 보딩패스 `search.svg`, manifest 항목을 삭제한다. 8개 보딩패스 페이지에서 `useBagHandlers` import·호출·spread props를 제거한 뒤 hook과 `EmptyBagToast` 파일을 삭제한다. 세 페이지 테스트에서 해당 hook mock도 제거한다.

`StoreMenu`, wishlist/cart 페이지의 자체 빈 상태, session/API 코드는 변경하지 않는다.

- [ ] **Step 5: GREEN과 영향받은 페이지 회귀를 확인한다**

```powershell
npm.cmd run test:run -- src/app/App.test.jsx src/shared/layout/BoardingPassChrome.test.jsx
npm.cmd run test:run -- src/pages/boarding-pass/landing/LandingPage.test.jsx src/pages/boarding-pass/flight/FlightPage.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
rg "useBagHandlers|EmptyBagToast|SearchIcon|icons/search.svg" src
```

Expected: 두 테스트 명령이 PASS하고 마지막 검색은 exit code 1로 일치 항목이 없다.

- [ ] **Step 6: 라우팅 기능 단위를 커밋한다**

```powershell
git add -A src
git commit -m "feat: 보딩패스 공통 헤더 라우팅 연결"
```

---

### Task 2: 상단 safe area와 화면 높이 보정

**Files:**
- Modify: `src/shared/layout/BoardingPassChrome.jsx`
- Modify: `src/shared/layout/BoardingPassChrome.module.scss`
- Modify: `src/shared/layout/BoardingPassChrome.test.jsx`
- Modify: `src/pages/boarding-pass/landing/LandingPage.module.scss`
- Modify: `src/pages/boarding-pass/landing/LandingPage.test.jsx`
- Modify: `src/pages/boarding-pass/passport/PassportPage.module.scss`
- Modify: `src/pages/boarding-pass/passport/PassportPage.test.jsx`

**Interfaces:**
- Consumes: `--mcm-safe-top`, `--mcm-header-height`, `--mcm-viewport-stable`
- Produces: safe inset + 43px title band + 54px icon row, 그리고 남은 높이를 채우는 Landing/Passport stage

- [ ] **Step 1: CSS 계약의 실패 테스트를 작성한다**

`BoardingPassChrome.test.jsx`에서 banner의 `padding-top`과 배경색, 타이틀 43px, 아이콘 행 54px을 computed style로 검증한다. `LandingPage.test.jsx`와 `PassportPage.test.jsx`는 기존 접근 가능한 요소에서 stage를 찾고 다음 값을 검증한다.

```js
expect(window.getComputedStyle(stage).minHeight).toBe(
  'calc(var(--mcm-viewport-stable) - var(--mcm-header-height) - var(--mcm-safe-top))',
)
```

- [ ] **Step 2: RED를 확인한다**

```powershell
npm.cmd run test:run -- src/shared/layout/BoardingPassChrome.test.jsx src/pages/boarding-pass/landing/LandingPage.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
```

Expected: header에 safe padding/background 계약이 없고 두 stage가 safe top을 빼지 않아 FAIL한다.

- [ ] **Step 3: 공통 Chrome에 safe area를 한 번 적용한다**

```scss
.header {
  padding-top: var(--mcm-safe-top);
  background: var(--mcm-color-canvas);
}
```

`BoardingPassChrome`의 `<header>`에는 `styles.header`와 전달받은 `className`을 함께 적용한다. `--mcm-header-height`와 `MobileShell`, Dynamic Island, `StoreMenu` 위치 계산은 변경하지 않는다.

- [ ] **Step 4: Landing과 Passport stage 높이를 보정한다**

```scss
min-height: calc(
  var(--mcm-viewport-stable) - var(--mcm-header-height) - var(--mcm-safe-top)
);
```

Landing과 Passport에서만 위 계산을 적용한다. 나머지 여섯 화면의 flex 본문은 헤더가 커진 만큼 자동으로 줄어드므로 페이지별 보정 코드를 만들지 않는다.

- [ ] **Step 5: GREEN과 전체 보딩패스 route smoke를 확인한다**

```powershell
npm.cmd run test:run -- src/shared/layout/BoardingPassChrome.test.jsx src/pages/boarding-pass/landing/LandingPage.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx src/app/App.test.jsx
```

Expected: 모든 테스트가 PASS하고 8개 보딩패스 라우트가 공통 Chrome을 렌더한다.

- [ ] **Step 6: 실제 Edge rect로 safe area를 검증한다**

새 npm 패키지는 추가하지 않는다. SDD scratch workspace에 일회성 Edge CDP 스크립트를 두고 repo 밖 임시 user-data-dir로 실행한다. `1200px` 이상 데스크톱 shell에서 screen-relative rect는 오차 `0.5px` 이내로 다음을 만족해야 한다.

```text
screen            390×844
safe inset        y=0..44, canvas background
dynamic island    y=11..42
title band        y=44..87
icon row          y=87..141
Landing/Passport  stage y=141, height=703
open StoreMenu    top=141
```

safe top `0px`에서는 header 97px, stage y=97·height=747이어야 한다. `320×844`, `390×844`, `430×932`에서 safe top `0px`와 강제 `44px`을 각각 측정해 `scrollWidth === innerWidth`, 헤더·stage가 shell 밖으로 벗어나지 않는지 확인한다. 브라우저 프로필과 캡처 산출물은 git-ignored SDD workspace에만 둔다.

- [ ] **Step 7: safe-area 기능 단위를 커밋한다**

```powershell
git add src/shared/layout/BoardingPassChrome.jsx src/shared/layout/BoardingPassChrome.module.scss src/shared/layout/BoardingPassChrome.test.jsx src/pages/boarding-pass/landing/LandingPage.module.scss src/pages/boarding-pass/landing/LandingPage.test.jsx src/pages/boarding-pass/passport/PassportPage.module.scss src/pages/boarding-pass/passport/PassportPage.test.jsx
git commit -m "fix: 보딩패스 상단 safe area 적용"
```

---

### Task 3: 문서 정합성과 최종 통합 검증

**Files:**
- Modify: `docs/frontend-development-plan.md`
- Modify: `docs/superpowers/plans/2026-08-12-boarding-chrome-routing-safe-area.md`

**Interfaces:**
- Consumes: Task 1~2의 실제 구현·테스트·브라우저 측정 결과
- Produces: 헤더 D-04/D-06/D-07 제거가 반영된 최신 후속 백로그와 검증 기록

- [ ] **Step 1: 후속 백로그를 실제 구현 상태로 갱신한다**

`docs/frontend-development-plan.md`에서 보딩패스 메뉴·검색, 빈 가방 토스트 상품 이동, 데이터가 있는 위시리스트·쇼핑백 이동을 미구현 항목에서 제거한다. 검색은 구현 완료가 아니라 기획 부재로 삭제했음을 한 문장으로 남긴다. API 기반 빈 상태 개선이 별도 항목으로 이미 존재하면 중복 항목을 만들지 않는다.

- [ ] **Step 2: 전체 자동 검증을 새로 실행한다**

```powershell
npm.cmd run verify
git diff --check
```

Expected: lint, format, 전체 Vitest, production build, whitespace 검사가 모두 exit code 0이다. 기존 Lightning CSS 경고가 다시 나오면 경고 원문을 보고하되 exit code 0을 실패로 바꾸지 않는다.

- [ ] **Step 3: 라우팅과 브라우저 결과를 교차 확인한다**

```powershell
git status --short
git log --oneline -5
```

메인과 메뉴 Boarding은 `/boarding-pass/intro`, 보딩패스 Chrome의 메뉴는 기존 StoreMenu, 로고·위시리스트·쇼핑백은 각각 `/`, `/wishlist`, `/cart`, 검색 아이콘은 없음, safe-area rect는 Task 2 기준을 만족하는지 결과 파일과 테스트를 대조한다.

- [ ] **Step 4: 문서 단위를 커밋한다**

```powershell
git add docs/frontend-development-plan.md docs/superpowers/plans/2026-08-12-boarding-chrome-routing-safe-area.md
git commit -m "docs: 보딩패스 헤더 백로그 정리"
```

- [ ] **Step 5: 최종 코드 리뷰 후 develop 통합 준비 상태를 보고한다**

최종 리뷰는 기능 브랜치 전체 diff에서 라우팅, 포커스, safe area 이중 적용, 죽은 API·검색 코드, 320~430px overflow를 확인한다. 사용자 보고에는 각 로컬 커밋 메시지, 변경 내용, 자동·브라우저 검증 결과, 알려진 잔여 항목을 포함한다. 원격 push는 별도 허가 전까지 수행하지 않는다.
