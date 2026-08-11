# 과잉 구현 축소 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 Figma 화면, 모바일·데스크톱 표시, 접근성 동작과 회원가입 API용 폼 값을 유지하면서 임시 산출물, 미사용 의존성, 중복 접근성 CSS, 불필요한 props·라우트 메타데이터·테스트 전용 마크업을 제거한다.

**Architecture:** 기존 React Router 페이지 구조와 `StoreMenuProvider` Context 경계는 유지한다. 화면별 SCSS Module에 반복된 비시각 텍스트 스타일만 Tailwind `sr-only`로 모으고, 회원가입의 커스텀 달력·국가 선택 컴포넌트는 공개 동작을 바꾸지 않은 채 내부 기본값만 줄인다. 메뉴는 현행 CSS 애니메이션 DOM과 범용 포커스 트랩을 유지하면서 닫기 콜백만 하나로 합친다.

**Tech Stack:** React 19, React Router 7, JavaScript, SCSS Modules, Tailwind CSS 4, Vitest, React Testing Library

## Global Constraints

- 데스크톱 휴대폰 프레임, Dynamic Island, 물리 버튼 외형과 모바일 safe-area/viewport 처리를 변경하지 않는다.
- `BirthDateField`의 달력, `NationalitySelect`의 검색·국기·다국어·키보드 동작을 유지한다.
- 회원가입 폼 값은 `birthDate: YYYY-MM-DD`, `nationality: string`을 유지한다.
- 메뉴의 슬라이드 애니메이션, 배경 닫기, Escape 닫기, 포커스 순환·복원, 스크롤 잠금을 유지한다.
- 네이티브 `dialog`, `input[type='date']`, `select`로 교체하지 않는다.
- 새로운 런타임·테스트 의존성을 설치하지 않는다. `country-flag-icons`는 유지한다.
- 현재 작업 트리에 있는 기존 디자인 변경을 보존한다. `git reset`, `git checkout`, `git add .`, 전체 파일 포맷은 사용하지 않는다.
- 각 커밋은 아래 명시된 경로만 스테이징하고 `git diff --cached --check`, `git diff --cached --name-only`, `git diff --cached`로 내용을 확인한다.
- 커밋은 가능하지만 푸시는 하지 않는다. 푸시 전 커밋 목록·작업 내용·커밋 메시지를 사용자에게 보고하고 명시적 허가를 받는다.

## Target File Map

### 회원가입 계약과 내부 구현

- Modify: `package.json`
- Modify: `package-lock.json`
- Keep as provenance: `docs/third-party-notices.md`
- Modify: `src/pages/signup/SignupPage.test.jsx`
- Modify: `src/pages/signup/SignupPage.jsx`
- Modify: `src/pages/signup/SignupPage.module.scss`
- Modify: `src/pages/signup/components/BirthDateField.jsx`
- Modify: `src/pages/signup/components/BirthDateField.module.scss`
- Modify: `src/pages/signup/components/NationalitySelect.jsx`
- Modify: `src/pages/signup/components/NationalitySelect.module.scss`
- Modify: `src/pages/signup/components/country-options.js`

### 메뉴와 라우팅

- Modify: `src/app/App.test.jsx`
- Modify: `src/app/router.jsx`
- Modify: `src/shared/layout/store-menu/StoreMenu.jsx`
- Modify: `src/shared/layout/store-menu/StoreMenuProvider.jsx`
- Preserve without redesign: `src/shared/layout/store-menu/StoreMenu.module.scss`
- Preserve without redesign: `src/shared/layout/mobile-shell/MobileShell.jsx`
- Preserve without redesign: `src/shared/layout/mobile-shell/MobileShell.module.scss`

### 접근성 숨김 스타일과 테스트 전용 마크업

- Modify: `src/pages/cart/CartPage.jsx`
- Modify: `src/pages/cart/CartPage.module.scss`
- Modify: `src/pages/product-list/ProductListPage.jsx`
- Modify: `src/pages/product-list/ProductListPage.module.scss`
- Modify: `src/pages/product-detail/ProductDetailPage.jsx`
- Modify: `src/pages/product-detail/ProductDetailPage.module.scss`
- Modify: `src/pages/product-detail/ProductDetailPage.test.jsx`
- Modify: `src/pages/signup/SignupPage.jsx`
- Modify: `src/pages/signup/SignupPage.module.scss`
- Modify: `src/pages/signup/components/BirthDateField.jsx`
- Modify: `src/pages/signup/components/BirthDateField.module.scss`
- Modify: `src/pages/signup/components/NationalitySelect.jsx`
- Modify: `src/pages/signup/components/NationalitySelect.module.scss`
- Modify: `src/pages/try-on/TryOnPage.jsx`
- Modify: `src/pages/try-on/TryOnPage.module.scss`
- Modify: `src/pages/try-on/TryOnPage.test.jsx`
- Modify: `src/pages/wishlist/WishlistPage.jsx`
- Modify: `src/pages/wishlist/WishlistPage.module.scss`

### 제거 확인 대상

- Delete if present: `.codex-visual-check.mjs`
- Delete if present: `.codex-edge-profile/`
- Delete if present: `.codex-edge-shot-desktop/`
- Delete if present: `.codex-edge-shot-mobile/`

---

### Task 1: 기준선과 작업 트리 안전장치 확정

**Files:**

- Inspect: all files in the Target File Map
- Test: `src/app/App.test.jsx`
- Test: `src/pages/signup/SignupPage.test.jsx`
- Test: `src/pages/product-list/ProductListPage.test.jsx`
- Test: `src/pages/product-detail/ProductDetailPage.test.jsx`
- Test: `src/pages/try-on/TryOnPage.test.jsx`
- Test: `src/pages/wishlist/WishlistPage.test.jsx`
- Test: `src/pages/cart/CartPage.test.jsx`

- [ ] **Step 1: 현재 브랜치와 기존 변경을 기록한다**

Run:

```powershell
git status --short --branch
git diff --stat
git diff --check
```

Expected: `develop`이 `origin/develop`보다 앞서 있고 기존 화면 관련 수정이 남아 있다. `git diff --check`는 출력 없이 종료한다. 기존 변경은 되돌리지 않는다.

- [ ] **Step 2: 축소 대상 제품 코드의 줄 수 기준선을 기록한다**

Run:

```powershell
$reductionTargets = @(
  'src/app/router.jsx',
  'src/shared/layout/store-menu/StoreMenu.jsx',
  'src/shared/layout/store-menu/StoreMenuProvider.jsx',
  'src/pages/cart/CartPage.jsx',
  'src/pages/cart/CartPage.module.scss',
  'src/pages/product-list/ProductListPage.jsx',
  'src/pages/product-list/ProductListPage.module.scss',
  'src/pages/product-detail/ProductDetailPage.jsx',
  'src/pages/product-detail/ProductDetailPage.module.scss',
  'src/pages/signup/SignupPage.jsx',
  'src/pages/signup/SignupPage.module.scss',
  'src/pages/signup/components/BirthDateField.jsx',
  'src/pages/signup/components/BirthDateField.module.scss',
  'src/pages/signup/components/NationalitySelect.jsx',
  'src/pages/signup/components/NationalitySelect.module.scss',
  'src/pages/signup/components/country-options.js',
  'src/pages/try-on/TryOnPage.jsx',
  'src/pages/try-on/TryOnPage.module.scss',
  'src/pages/wishlist/WishlistPage.jsx',
  'src/pages/wishlist/WishlistPage.module.scss'
)
($reductionTargets | ForEach-Object { (Get-Content -Encoding UTF8 -LiteralPath $_).Count } | Measure-Object -Sum).Sum
```

Expected: 현재 기준선은 `4384`줄이다. 완료 후 같은 명령의 결과가 `4384`보다 작아야 한다.

- [ ] **Step 3: 축소 작업 전 행동 기준선을 실행한다**

Run:

```powershell
npm.cmd run test:run -- src/app/App.test.jsx src/pages/signup/SignupPage.test.jsx src/pages/product-list/ProductListPage.test.jsx src/pages/product-detail/ProductDetailPage.test.jsx src/pages/try-on/TryOnPage.test.jsx src/pages/wishlist/WishlistPage.test.jsx src/pages/cart/CartPage.test.jsx
```

Expected: 모든 대상 테스트 통과. 실패하면 코드 축소를 시작하지 않고 `superpowers:systematic-debugging`으로 기존 실패 원인을 먼저 분리한다.

- [ ] **Step 4: 임시 시각 검증 산출물의 현재 상태를 확인한다**

Run:

```powershell
Get-ChildItem -Force -Name .codex*
```

Expected: 현재 기준으로 출력 없음. 항목이 다시 생성되어 있다면 Task 5의 검증된 절대 경로 삭제 절차만 사용한다.

- [ ] **Step 5: 기준선 단계에서는 커밋하지 않는다**

이 단계는 읽기와 테스트만 수행한다.

---

### Task 2: 회원가입 폼 계약을 행동 중심으로 검증하고 내부 구현 축소

**Files:**

- Modify: `src/pages/signup/SignupPage.test.jsx`
- Modify: `src/pages/signup/SignupPage.jsx`
- Modify: `src/pages/signup/SignupPage.module.scss`
- Modify: `src/pages/signup/components/BirthDateField.jsx`
- Modify: `src/pages/signup/components/BirthDateField.module.scss`
- Modify: `src/pages/signup/components/NationalitySelect.jsx`
- Modify: `src/pages/signup/components/NationalitySelect.module.scss`
- Modify: `src/pages/signup/components/country-options.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Verify only: `docs/third-party-notices.md`

- [ ] **Step 1: 테스트가 숨겨진 input 구현 대신 제출 값을 검증하도록 바꾼다**

`SignupPage.test.jsx`에 다음 헬퍼를 추가한다.

```jsx
function getSignupFormData() {
  const submitButton = screen.getByRole('button', { name: '가입하기' })
  return new FormData(submitButton.closest('form'))
}
```

국적 선택 테스트의 직접 DOM 조회를 다음 assertion으로 교체한다.

```jsx
expect(getSignupFormData().get('nationality')).toBe('Republic of Korea')
```

국기 CSS class 이름을 검사하는 assertion은 접근 가능한 이미지 이름 검증으로 교체한다.

```jsx
expect(
  within(koreaOption).getByRole('img', { name: 'Republic of Korea 국기' }),
).toBeInTheDocument()
```

생년월일 테스트의 직접 DOM 조회를 다음 assertion으로 교체한다.

```jsx
expect(getSignupFormData().get('birthDate')).toBe('2000-02-29')
```

RTL 테스트의 `dir` 속성·`compareDocumentPosition` 내부 구조 assertion은 검색·표시·선택 결과로 교체한다.

```jsx
const bahrainOption = screen.getByRole('option', { name: 'البحرين (Bahrain)' })
expect(bahrainOption).toHaveTextContent('البحرين (Bahrain)')

fireEvent.click(bahrainOption)

expect(screen.getByRole('button', { name: /국적/ })).toHaveTextContent('البحرين (Bahrain)')
expect(getSignupFormData().get('nationality')).toBe('Kingdom of Bahrain')
```

이 변경은 동작 보존 리팩터링의 characterization test이므로 인위적인 RED를 만들지 않는다. 기존 UI 선택 동작과 API용 값이 함께 검증되어야 한다.

- [ ] **Step 2: 회원가입 테스트가 계약을 유지하는지 확인한다**

Run:

```powershell
npm.cmd run test:run -- src/pages/signup/SignupPage.test.jsx
```

Expected: 4개 회원가입 테스트 모두 통과.

- [ ] **Step 3: `BirthDateField`의 사용되지 않는 기본 동작을 제거한다**

다음 선언을 삭제한다.

```jsx
const noop = () => {}
```

optional JSDoc과 기본값이 붙은 함수 시그니처를 다음처럼 바꾼다.

```jsx
/**
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 * }} props
 */
export function BirthDateField({ value, onChange, isOpen, onOpenChange }) {
```

`SignupPage.jsx`가 네 props를 모두 전달하는 현재 호출부는 변경하지 않는다.

- [ ] **Step 4: 사용하지 않는 devDependency만 제거한다**

Run:

```powershell
npm.cmd uninstall --save-dev world-countries
```

Expected: `package.json`과 `package-lock.json`에서 `world-countries`만 사라지고 `country-flag-icons`는 유지된다. `docs/third-party-notices.md`의 `world-countries` 출처 표기는 로컬 파생 데이터의 라이선스 이력이므로 유지한다.

Verify:

```powershell
rg -n 'world-countries' package.json package-lock.json
npm.cmd ls country-flag-icons --depth=0
```

Expected: 첫 명령은 일치 항목 없음, 두 번째 명령은 `country-flag-icons@1.6.20`을 표시한다.

- [ ] **Step 5: 회원가입 내부의 중복 접근성 class를 `sr-only`로 교체한다**

다음 세 JSX 파일에서 `className={styles.visuallyHidden}`를 `className="sr-only"`로 바꾼다.

```text
src/pages/signup/SignupPage.jsx
src/pages/signup/components/BirthDateField.jsx
src/pages/signup/components/NationalitySelect.jsx
```

다음 세 SCSS Module에서 `.visuallyHidden` 블록 전체를 삭제한다.

```text
src/pages/signup/SignupPage.module.scss
src/pages/signup/components/BirthDateField.module.scss
src/pages/signup/components/NationalitySelect.module.scss
```

필수 입력 문구, 달력 dialog 제목·live region, 국가 accessible label과 기존 ARIA 속성은 유지한다.

- [ ] **Step 6: 회원가입 동작과 포맷을 재검증한다**

Run:

```powershell
npm.cmd run test:run -- src/pages/signup/SignupPage.test.jsx
npx.cmd eslint src/pages/signup --max-warnings=0
npx.cmd prettier src/pages/signup package.json --check
rg -n "\.visuallyHidden|styles\.visuallyHidden" src/pages/signup
```

Expected: 테스트·ESLint·Prettier는 통과하고 `rg`는 출력이 없다. 날짜·국적 UI와 제출값은 변경 전과 동일하다.

- [ ] **Step 7: 회원가입 기능 단위만 커밋한다**

현재 `src/pages/signup/components/`가 신규 파일 묶음이므로 컴포넌트 일부만 남기지 않고 회원가입 기능 전체를 함께 스테이징한다.

```powershell
git add package.json package-lock.json docs/third-party-notices.md src/pages/signup
git diff --cached --check
git diff --cached --name-only
git diff --cached
git commit -m "feat: 회원가입 입력 인터랙션 정리"
```

Expected: 회원가입 화면, 입력 컴포넌트, 테스트, 국기 의존성, 라이선스 문서만 포함한다. 다른 화면 파일이 보이면 커밋하지 않고 해당 경로를 index에서 제외한다.

---

### Task 3: 스토어 메뉴 배선과 라우트 테스트 단순화

**Files:**

- Modify: `src/shared/layout/store-menu/StoreMenu.jsx`
- Modify: `src/shared/layout/store-menu/StoreMenuProvider.jsx`
- Modify: `src/app/router.jsx`
- Modify: `src/app/App.test.jsx`
- Preserve: `src/shared/layout/store-menu/StoreMenu.module.scss`
- Preserve: `src/shared/layout/mobile-shell/MobileShell.jsx`
- Preserve: `src/shared/layout/mobile-shell/MobileShell.module.scss`

- [ ] **Step 1: 메뉴 테스트를 사용자 관찰 가능 상태로 바꾼다**

`App.test.jsx`에서 다음을 수행한다.

- 프로덕션에서 읽지 않는 `mcm-boarding-complete` sessionStorage 테스트를 삭제한다.
- `afterEach`의 `window.sessionStorage.clear()`를 삭제한다.
- `data-state`, `aria-hidden`, `inert` assertion은 접근성·애니메이션 계약이므로 유지한다.
- 메뉴 열기 전 버튼이 `aria-expanded="false"`, 열린 뒤 닫기 버튼이 `aria-expanded="true"`, 닫힌 뒤 열기 버튼이 다시 `aria-expanded="false"`인지 검증한다.
- 스크롤 잠금은 확정 유지 조건이므로 메뉴가 열렸을 때 `html`과 `body`에 `store-menu-open` class가 생기고 닫힌 뒤 사라지는 assertion은 유지한다. JSDOM에서 실제 CSS overflow 계산을 신뢰할 수 없어 이 class가 스크롤 잠금의 최소 계약이다.
- dialog 출현·소멸, 배경 닫기, 로그인 이동, Escape 닫기와 버튼 포커스 복원, 양방향 Tab 순환, 프로그래밍 방식 라우트 변경 후 닫힘 테스트는 유지한다.
- 데스크톱 `[data-device-frame]` 테스트는 그대로 유지한다.
- 숨겨진 `상품 ID:` 문구를 검사하는 동적 ID 테스트는 사용자 경로 테스트로 다시 작성한다. `mcm-002` 상세의 실제 상품명과 착용 링크, 착용 화면 진입, 상세로 복귀했을 때의 pathname을 검증한다.

핵심 열기·닫기 assertion은 다음 형태로 둔다.

```jsx
const menuButton = await screen.findByRole('button', { name: '메뉴 열기' })
expect(menuButton).toHaveAttribute('aria-expanded', 'false')

fireEvent.click(menuButton)

const closeButton = screen.getByRole('button', { name: '메뉴 닫기' })
expect(closeButton).toHaveAttribute('aria-expanded', 'true')
expect(screen.getByRole('dialog', { name: '전체 메뉴' })).toBeInTheDocument()

fireEvent.click(closeButton)

expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
expect(screen.getByRole('button', { name: '메뉴 열기' })).toHaveAttribute(
  'aria-expanded',
  'false',
)
```

동적 상품 경로 테스트는 다음 형태로 교체한다.

```jsx
it('선택한 상품 경로를 착용 화면과 상세 복귀에 유지한다', async () => {
  const router = renderRoute('/products/mcm-002')

  expect(
    await screen.findByRole('heading', { name: 'New Liz 비세토스 쇼퍼' }),
  ).toBeInTheDocument()

  const tryOnLink = screen.getByRole('link', { name: '착용하기' })
  expect(tryOnLink).toHaveAttribute('href', '/products/mcm-002/try-on')

  fireEvent.click(tryOnLink)

  expect(await screen.findByRole('heading', { name: '상품 착용' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/products/mcm-002/try-on')

  fireEvent.click(screen.getByRole('button', { name: '상품 상세로 돌아가기' }))

  expect(
    await screen.findByRole('heading', { name: 'New Liz 비세토스 쇼퍼' }),
  ).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/products/mcm-002')
})
```

- [ ] **Step 2: 변경한 테스트가 현재 메뉴 행동을 보존하는지 확인한다**

Run:

```powershell
npm.cmd run test:run -- src/app/App.test.jsx
```

Expected: route case, 디바이스 프레임, 메뉴 열기·닫기·이동·포커스 테스트가 모두 통과한다.

- [ ] **Step 3: 동일한 닫기 콜백 props를 하나로 합친다**

`StoreMenu.jsx`에서 `onDismiss`, `onNavigate`를 `onClose`로 통합한다.

- `BoardingCard({ onNavigate })`를 `BoardingCard({ onClose })`로 바꾸고 해당 Link의 `onClick`을 `onClose`로 바꾼다.
- `CollectionCard({ onNavigate })`를 `CollectionCard({ onClose })`로 바꾸고 해당 Link의 `onClick`을 `onClose`로 바꾼다.
- `StoreMenu({ isOpen, onDismiss, onNavigate })`를 `StoreMenu({ isOpen, onClose })`로 바꾼다.
- backdrop, `BoardingCard`, `CollectionCard`, 로그인 Link에 전달되는 닫기 handler를 모두 `onClose` 하나로 바꾼다.

`StoreMenuProvider.jsx` 호출부는 다음처럼 바꾼다.

```jsx
<StoreMenu isOpen={isOpen} onClose={closeMenu} />
```

location key 기반 상태, Context 값, Escape effect, `data-state`, `aria-hidden`, `inert`, 스크롤 잠금 class 처리는 삭제하지 않는다.

- [ ] **Step 4: 사용되지 않는 route ID를 제거한다**

`src/app/router.jsx`에서 root와 child route 객체의 `id` 속성 10개만 삭제한다. `path`, `index`, `lazy`, `Component`, `HydrateFallback`은 변경하지 않는다.

- [ ] **Step 5: 메뉴와 전체 라우트 회귀를 실행한다**

Run:

```powershell
npm.cmd run test:run -- src/app/App.test.jsx
rg -n '^\s+id:' src/app/router.jsx
```

Expected: App 테스트 전체 통과, `rg` 출력 없음.

- [ ] **Step 7: 공통 프레임·메뉴 기능 단위만 커밋한다**

현재 작업 트리의 승인된 랜딩·디바이스 프레임 디테일이 메뉴와 같은 공통 셸 단위에 있으므로 아래 경로만 함께 검토한다.

```powershell
git add src/app/App.test.jsx src/app/router.jsx src/pages/home/HomePage.jsx src/pages/home/HomePage.module.scss src/shared/layout/mobile-shell src/shared/layout/store-header src/shared/layout/store-menu src/styles/_tokens.scss src/styles/globals.scss
git diff --cached --check
git diff --cached --name-only
git diff --cached
git commit -m "feat: 데스크톱 디바이스 프레임과 공통 메뉴 정리"
```

Expected: 데스크톱 휴대폰 외형은 삭제되지 않고, 랜딩 및 공통 셸·메뉴·라우팅·관련 테스트만 포함한다.

---

### Task 4: 남은 페이지의 `sr-only` 통합과 테스트 전용 상품 ID 마크업 제거

**Files:**

- Modify: the non-signup JSX and SCSS files listed under “접근성 숨김 스타일과 테스트 전용 마크업”
- Test: `src/pages/product-detail/ProductDetailPage.test.jsx`
- Test: `src/pages/try-on/TryOnPage.test.jsx`
- Test: `src/pages/wishlist/WishlistPage.test.jsx`
- Test: `src/pages/cart/CartPage.test.jsx`
- Test: `src/app/App.test.jsx`

- [ ] **Step 1: 테스트 전용 상품 ID가 없어야 한다는 실패 테스트를 먼저 추가한다**

`ProductDetailPage.test.jsx`의 기존 테스트에 다음 assertion을 추가한다.

```jsx
expect(screen.getByRole('heading', { name: 'Diamant 비세토스 3D 참' })).toBeInTheDocument()
expect(screen.getByRole('link', { name: '착용하기' })).toHaveAttribute(
  'href',
  '/products/mcm-001/try-on',
)
expect(screen.queryByText(/상품 ID:/)).not.toBeInTheDocument()
```

`TryOnPage.test.jsx`의 첫 테스트에도 다음 assertion을 추가한다.

```jsx
expect(screen.queryByText(/상품 ID:/)).not.toBeInTheDocument()
```

- [ ] **Step 2: 새 assertion이 예상한 이유로 실패하는지 확인한다**

Run:

```powershell
npm.cmd run test:run -- src/pages/product-detail/ProductDetailPage.test.jsx src/pages/try-on/TryOnPage.test.jsx
```

Expected: 두 페이지 DOM에 현재 `상품 ID:` 문구가 존재하므로 `not.toBeInTheDocument()`가 실패한다. 상품명·착용 링크 assertion은 통과해야 한다.

- [ ] **Step 3: 테스트 전용 상품 ID 문구만 삭제한다**

`ProductDetailPage.jsx`에서 다음 요소를 삭제한다.

```jsx
<p className={styles.visuallyHidden}>상품 ID: {product.id}</p>
```

`TryOnPage.jsx`에서 다음 요소를 삭제한다.

```jsx
<p className={styles.visuallyHidden}>상품 ID: {productId}</p>
```

`TryOnPage`의 `productId`는 닫기 버튼이 원래 상세 경로로 돌아갈 때 계속 사용되므로 `useParams`와 변수는 유지한다.

- [ ] **Step 4: 모든 중복 접근성 class 사용을 Tailwind `sr-only`로 교체한다**

Target File Map의 남은 비회원가입 JSX에서 아래 형태를 모두 바꾼다. 회원가입의 같은 교체는 Task 2에서 완료한다.

```jsx
className={styles.visuallyHidden}
```

Replacement:

```jsx
className="sr-only"
```

대상은 상품 목록의 `h1`·`h2`, 상품 상세의 `h1`·status, 착용 화면의 live region·`h1`, 위시리스트·쇼핑백 `h1`이다. 텍스트, role, `aria-live`, `aria-labelledby`, id는 유지한다.

- [ ] **Step 5: 남은 5개 SCSS Module의 중복 선언을 삭제한다**

다음 파일의 `.visuallyHidden` 블록 전체만 삭제한다.

```text
src/pages/cart/CartPage.module.scss
src/pages/product-list/ProductListPage.module.scss
src/pages/product-detail/ProductDetailPage.module.scss
src/pages/try-on/TryOnPage.module.scss
src/pages/wishlist/WishlistPage.module.scss
```

Tailwind는 `src/main.jsx`에서 `src/styles/tailwind.css`로 이미 로드되므로 공통 CSS를 새로 만들지 않는다.

- [ ] **Step 6: 중복 제거와 접근성 행동을 검증한다**

Run:

```powershell
rg -n "\.visuallyHidden|styles\.visuallyHidden|상품 ID:" src
npm.cmd run test:run -- src/app/App.test.jsx src/pages/signup/SignupPage.test.jsx src/pages/product-list/ProductListPage.test.jsx src/pages/product-detail/ProductDetailPage.test.jsx src/pages/try-on/TryOnPage.test.jsx src/pages/wishlist/WishlistPage.test.jsx src/pages/cart/CartPage.test.jsx
```

Expected: `rg` 출력 없음, 모든 대상 테스트 통과. 스크린리더용 제목과 live region은 role/name 조회로 계속 발견되어야 한다.

- [ ] **Step 7: 페이지 디테일과 접근성 정리 단위만 커밋한다**

기존 반응형 디테일 변경과 같은 페이지 파일에 있으므로 아래 페이지 경로만 함께 검토·스테이징한다.

```powershell
git add src/pages/cart src/pages/login/LoginPage.module.scss src/pages/product-list src/pages/product-detail src/pages/try-on src/pages/wishlist
git diff --cached --check
git diff --cached --name-only
git diff --cached
git commit -m "style: 주요 화면 반응형과 접근성 스타일 정리"
```

Expected: 상품·착용·위시리스트·쇼핑백·로그인 화면과 해당 테스트만 포함하고, 회원가입과 공통 셸 파일은 포함하지 않는다.

---

### Task 5: 임시 산출물 제거 확인과 전체 검증

**Files:**

- Delete if present: `.codex-visual-check.mjs`
- Delete if present: `.codex-edge-profile/`
- Delete if present: `.codex-edge-shot-desktop/`
- Delete if present: `.codex-edge-shot-mobile/`
- Verify: entire repository

- [ ] **Step 1: 삭제 대상을 절대 경로로 검증한다**

Run:

```powershell
$workspaceRoot = (Resolve-Path -LiteralPath 'C:\hackathon').Path
$artifactPaths = @(
  'C:\hackathon\.codex-visual-check.mjs',
  'C:\hackathon\.codex-edge-profile',
  'C:\hackathon\.codex-edge-shot-desktop',
  'C:\hackathon\.codex-edge-shot-mobile'
)
$existingArtifacts = $artifactPaths | Where-Object { Test-Path -LiteralPath $_ }
$existingArtifacts | ForEach-Object {
  $resolvedArtifact = (Resolve-Path -LiteralPath $_).Path
  if (-not $resolvedArtifact.StartsWith($workspaceRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Workspace 밖의 삭제 대상: $resolvedArtifact"
  }
  $resolvedArtifact
}
```

Expected: 현재 기준으로 출력 없음. 출력이 있더라도 모두 `C:\hackathon\` 아래의 네 명시 경로여야 한다.

- [ ] **Step 2: 검증을 통과한 임시 산출물만 제거한다**

경로 변수가 사라진 별도 PowerShell 세션에서도 안전하도록 검증을 반복한 뒤 삭제한다.

```powershell
$workspaceRoot = (Resolve-Path -LiteralPath 'C:\hackathon').Path
$artifactPaths = @(
  'C:\hackathon\.codex-visual-check.mjs',
  'C:\hackathon\.codex-edge-profile',
  'C:\hackathon\.codex-edge-shot-desktop',
  'C:\hackathon\.codex-edge-shot-mobile'
)
$existingArtifacts = $artifactPaths | Where-Object { Test-Path -LiteralPath $_ }
$existingArtifacts | ForEach-Object {
  $resolvedArtifact = (Resolve-Path -LiteralPath $_).Path
  if (-not $resolvedArtifact.StartsWith($workspaceRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Workspace 밖의 삭제 대상: $resolvedArtifact"
  }
  Remove-Item -LiteralPath $resolvedArtifact -Recurse -Force
}
```

Expected: 네 대상이 모두 없어짐. 이 파일들은 untracked 임시 산출물이므로 삭제 시 Git 복구 대상이 아니다. 이미 없으면 아무 작업도 하지 않는다.

- [ ] **Step 3: 승인 범위를 정적 검색으로 확인한다**

Run:

```powershell
rg -n 'world-countries' package.json package-lock.json
rg -n "\.visuallyHidden|styles\.visuallyHidden|상품 ID:|mcm-boarding-complete" src
rg -n '^\s+id:' src/app/router.jsx
rg -n 'onDismiss|onNavigate' src/shared/layout/store-menu
npm.cmd ls country-flag-icons --depth=0
```

Expected: 처음 네 `rg` 명령은 출력 없음. 국기 패키지는 설치 상태를 표시한다.

- [ ] **Step 4: 전체 품질 게이트를 실행한다**

Run:

```powershell
npm.cmd run verify
git diff --check
git status --short --branch
```

Expected: ESLint, Prettier check, 전체 Vitest, Vite production build가 모두 성공하고 whitespace 오류가 없다.

- [ ] **Step 5: 제품 코드가 실제로 줄었는지 확인한다**

Task 1 Step 2의 `$reductionTargets` 배열과 합산 명령을 다시 실행한다.

Expected: 결과가 기준선 `4384`보다 작다. 의존성도 `world-countries` 한 개가 줄어 있어야 한다.

- [ ] **Step 6: 시각·반응형 보존을 수동 확인한다**

Run:

```powershell
$devServerProcess = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '41731') -WorkingDirectory 'C:\hackathon' -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:41731
```

Expected: HTTP 200 응답. 같은 PowerShell 세션을 유지한 채 `http://127.0.0.1:41731`을 브라우저에서 확인한다.

확인 항목:

- 360px, 390px, 430px viewport에서 휴대폰 외형 없이 화면이 잘리지 않는다.
- 1440px desktop에서 기존 휴대폰 프레임, Dynamic Island, 물리 버튼이 보인다.
- `/signup` 달력과 국적 목록의 열기·닫기·선택·Escape·포커스 복원이 유지된다.
- `/` 메뉴의 slide, backdrop, Escape, Tab 순환, 링크 이동이 유지된다.
- `/products/mcm-001`, `/products/mcm-001/try-on`, `/wishlist`, `/cart`의 보이는 디자인이 변경 전과 같다.

확인이 끝나면 같은 PowerShell 세션에서 서버를 종료한다.

```powershell
if (-not $devServerProcess.HasExited) {
  Stop-Process -Id $devServerProcess.Id
}
```

Expected: 41731 포트의 이번 Vite 프로세스만 종료된다.

- [ ] **Step 7: Ponytail 최종 리뷰를 수행한다**

`ponytail-review` 스킬을 `full` 강도로 적용한다. 이번 설계 범위 안에서 새로 추가된 추상화·의존성·중복만 찾고, 데스크톱 휴대폰 외형이나 접근성 동작을 삭제하라는 제안은 제외한다. 추가 수정이 있다면 해당 대상 테스트와 `npm.cmd run verify`를 다시 실행한다.

- [ ] **Step 8: 커밋과 푸시 경계를 확인한다**

Run:

```powershell
git log --oneline origin/develop..HEAD
git status --short --branch
```

Expected: 기능 단위 커밋과 기존 문서 커밋이 보이며 의도하지 않은 staged 파일이 없다. 여기서 멈추고 사용자에게 다음을 보고한다.

1. 각 커밋 해시와 커밋 메시지
2. 커밋별 작업 파일과 사용자 동작 변화 여부
3. `npm.cmd run verify` 결과
4. 삭제한 임시 산출물과 복구 가능 여부

사용자가 명시적으로 허가하기 전에는 `git push`를 실행하지 않는다.
