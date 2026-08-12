# Screen Reader Only Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 접근성용 `상품 목록`, `상품 상세`, `Autumn Winter 2026` 제목과 상태 문구가 화면에는 보이지 않고 접근성 트리에는 유지되게 한다.

**Architecture:** Tailwind utilities가 생성되지 않는 현 상태와 독립적으로 동작하도록 `globals.scss`에 표준 `.sr-only` 규칙을 한 번 정의한다. 실제 상품 페이지 DOM을 렌더하는 Vitest에서 전역 스타일의 소비 결과를 검증한다.

**Tech Stack:** React 19, SCSS, Vitest, Testing Library, jsdom

## Global Constraints

- `h1`, `h2`, `section[aria-labelledby]`, `aria-live` DOM은 삭제하거나 `display:none` 처리하지 않는다.
- 페이지별 `visuallyHidden` 중복 클래스는 만들지 않는다.
- Tailwind 전체 파이프라인 교정과 새 의존성 추가는 이번 범위에서 제외한다.
- 기존 `.sr-only` 사용처가 모두 같은 전역 규칙을 사용한다.
- 원격 push는 별도 사용자 허가 전까지 수행하지 않는다.

---

### Task 1: 전역 화면 읽기 전용 스타일 복구

**Files:**
- Modify: `src/test/setup.js`
- Modify: `src/styles/globals.scss`
- Test: `src/pages/product-list/ProductListPage.test.jsx`
- Test: `src/pages/product-detail/ProductDetailPage.test.jsx`

**Interfaces:**
- Consumes: JSX의 기존 `className="sr-only"`
- Produces: 화면에서 1×1px로 clip되지만 접근성 트리에 남는 전역 `.sr-only`

- [ ] **Step 1: 테스트 환경에 실제 전역 스타일을 로드한다**

`src/test/setup.js` 상단에 production과 같은 전역 SCSS를 import한다.

```js
import '@/styles/globals.scss'
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 2: 상품 페이지 실패 테스트를 작성한다**

`ProductListPage.test.jsx`에 다음 테스트를 추가한다.

```jsx
it('접근성 제목을 화면에서 숨긴다', () => {
  renderPage()

  for (const heading of [
    screen.getByRole('heading', { level: 1, name: '상품 목록' }),
    screen.getByRole('heading', { level: 2, name: 'Autumn Winter 2026' }),
  ]) {
    const style = window.getComputedStyle(heading)
    expect(style.position).toBe('absolute')
    expect(style.width).toBe('1px')
    expect(style.height).toBe('1px')
    expect(style.overflow).toBe('hidden')
  }
})
```

`ProductDetailPage.test.jsx`에는 다음 테스트를 추가한다.

```jsx
it('페이지 제목을 화면에서 숨기고 접근성 이름은 유지한다', () => {
  renderPage()

  const heading = screen.getByRole('heading', { level: 1, name: '상품 상세' })
  const style = window.getComputedStyle(heading)

  expect(heading).toBeInTheDocument()
  expect(style.position).toBe('absolute')
  expect(style.width).toBe('1px')
  expect(style.height).toBe('1px')
  expect(style.overflow).toBe('hidden')
})
```

- [ ] **Step 3: 테스트가 올바른 이유로 실패하는지 확인한다**

Run:

```powershell
npm.cmd run test:run -- src/pages/product-list/ProductListPage.test.jsx src/pages/product-detail/ProductDetailPage.test.jsx
```

Expected: 두 신규 테스트가 `position`, `width`, `height` 중 첫 미적용 값에서 실패하고 기존 기능 테스트는 통과한다.

- [ ] **Step 4: 최소 전역 스타일을 구현한다**

`src/styles/globals.scss`에 다음 규칙을 추가한다.

```scss
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  border: 0;
  margin: -1px;
  white-space: nowrap;
}
```

- [ ] **Step 5: 집중 테스트 GREEN을 확인한다**

```powershell
npm.cmd run test:run -- src/pages/product-list/ProductListPage.test.jsx src/pages/product-detail/ProductDetailPage.test.jsx
npm.cmd run lint
git diff --check
```

Expected: 상품 목록·상세 테스트와 lint 통과, diff 오류 없음.

- [ ] **Step 6: 실제 Edge 화면을 확인한다**

새 Vite 포트에서 `/products`, `/products/mcm-001`을 열고 다음을 확인한다.

```js
const hiddenHeadings = [...document.querySelectorAll('.sr-only')].map((element) => {
  const style = getComputedStyle(element)
  return {
    text: element.textContent.trim(),
    position: style.position,
    width: style.width,
    height: style.height,
    overflow: style.overflow,
  }
})
```

Expected: 세 제목의 computed values가 `absolute / 1px / 1px / hidden`이고 화면 캡처에 중복 제목이 없다.

- [ ] **Step 7: 최소 기능 단위로 커밋한다**

```powershell
git add src/test/setup.js src/styles/globals.scss src/pages/product-list/ProductListPage.test.jsx src/pages/product-detail/ProductDetailPage.test.jsx
git commit -m "fix: 화면 읽기 전용 제목 숨김 복구"
```

---

### Task 2: 전체 회귀 검증

**Files:**
- Verify only: repository test and build inputs

**Interfaces:**
- Consumes: Task 1의 전역 `.sr-only`
- Produces: 다른 화면의 기존 숨김 문구를 포함한 병합 전 검증 근거

- [ ] **Step 1: 전체 검증을 실행한다**

```powershell
npm.cmd run verify
```

Expected: ESLint, Prettier, 전체 Vitest, production build 모두 exit 0.

- [ ] **Step 2: 작업트리와 커밋 범위를 확인한다**

```powershell
git diff --check
git status --short
git log -4 --oneline
```

Expected: 요청 범위 밖 production 변경 없음, 원격 push 없음.
