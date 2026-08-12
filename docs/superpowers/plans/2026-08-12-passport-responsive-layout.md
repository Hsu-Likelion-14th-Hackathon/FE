# Passport Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 열린 여권이 모바일 Figma 구도를 유지하면서 태블릿에서는 중앙에 온전히 보이고 데스크톱 휴대폰 셸에서는 프로필 정보가 잘리지 않게 한다.

**Architecture:** 기존 507×394px 여권 DOM과 Three.js CSS3DRenderer는 유지한다. `PassportPage.module.scss`의 위치 계산만 breakpoint별 CSS로 교정하고, 실제 Edge 브라우저의 DOM rect를 기준으로 RED/GREEN을 검증한다.

**Tech Stack:** React 19, SCSS Modules, Three.js CSS3DRenderer, Vite, Edge/Playwright 개발 검증

## Global Constraints

- Figma 기준은 `390×844`, 열린 프로필·스탬프 여권은 `507×394` 및 x≈66px이다.
- 320~767px의 기존 모바일 구도와 clipping을 유지한다.
- 768~1199px에서는 열린 여권 전체를 태블릿 본문 중앙에 표시한다.
- 1200px 이상에서는 390px 휴대폰 셸 기준 왼쪽 여백 `46.8px`을 사용한다.
- `MobileShell`, Three.js 카메라·pivot·스와이프·애니메이션은 변경하지 않는다.
- 새 npm 의존성과 JavaScript viewport 분기를 추가하지 않는다.
- 원격 push는 별도 사용자 허가 전까지 수행하지 않는다.

---

### Task 1: 열린 여권 breakpoint 위치 보정

**Files:**
- Modify: `src/pages/boarding-pass/passport/PassportPage.module.scss:109-115`
- Verify: `scratch/passport-responsive-check.cjs` (git-ignored 일회성 브라우저 검사)

**Interfaces:**
- Consumes: `.openPassport`, `data-passport-surface`, `data-testid="passport-turn"`, desktop `MobileShell` 390px screen
- Produces: 모바일 기존 위치, 태블릿 중앙 정렬, 데스크톱 46.8px 고정 위치

- [ ] **Step 1: 실제 브라우저 실패 검사를 작성한다**

`scratch/passport-responsive-check.cjs`는 기존 설치된 개발용 Playwright로 Edge를 열고 `/boarding-pass/passport`의 다음 단계 버튼을 한 번 클릭한 뒤 다음 값을 수집한다.

```js
const screen = document.querySelector('[data-device-screen]').getBoundingClientRect()
const passport = document
  .querySelector('[data-passport-surface]')
  .getBoundingClientRect()
const viewport = document
  .querySelector('[data-testid="passport-turn-surface"]')
  .getBoundingClientRect()

return {
  renderer: document.querySelector('[data-testid="passport-turn"]').dataset.renderer,
  passportLeftInScreen: passport.left - screen.left,
  passportRightInScreen: passport.right - screen.left,
  centerDelta: Math.abs((passport.left + passport.right) / 2 - viewport.left - viewport.width / 2),
  passportWidth: passport.width,
}
```

검사 literal은 다음과 같다.

```js
// 768, 1024, 1152
assert.equal(Math.round(result.passportWidth), 507)
assert.ok(result.centerDelta <= 2)
assert.ok(result.passportLeftInScreen >= 0)
assert.ok(result.passportRightInScreen <= viewportWidth)

// 1200, 1440 desktop device shell
assert.ok(Math.abs(result.passportLeftInScreen - 66.8) <= 2)
assert.ok(result.profileRightInScreen <= 390)
assert.equal(result.renderer, 'ready')
```

- [ ] **Step 2: 검사 실패를 확인한다**

Run:

```powershell
node scratch/passport-responsive-check.cjs
```

Expected: 768~1152px의 center 오차 또는 1200·1440px의 상대 x/프로필 경계 assertion이 실패한다.

- [ ] **Step 3: 최소 SCSS를 구현한다**

기존 모바일 규칙은 그대로 두고 다음 media query만 추가한다.

```scss
@media (min-width: 768px) and (max-width: 1199px) {
  .openPassport {
    margin-right: auto;
    margin-left: auto;
  }
}

@media (min-width: 1200px) {
  .openPassport {
    margin-right: 0;
    margin-left: 2.925rem;
  }
}
```

- [ ] **Step 4: 브라우저 GREEN과 영향 테스트를 확인한다**

Run:

```powershell
node scratch/passport-responsive-check.cjs
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPage.test.jsx src/pages/boarding-pass/passport/PassportPageTurn.test.jsx
npm.cmd run lint
git diff --check
```

Expected: 브라우저 모든 width assertion 통과, Passport 집중 테스트와 lint 통과, diff 오류 없음.

- [ ] **Step 5: 최소 기능 단위로 커밋한다**

```powershell
git add src/pages/boarding-pass/passport/PassportPage.module.scss
git commit -m "fix: 여권 태블릿과 데스크톱 배치 보정"
```

---

### Task 2: 전체 회귀 검증

**Files:**
- Verify only: repository test and build inputs

**Interfaces:**
- Consumes: Task 1의 breakpoint CSS
- Produces: 병합 전 검증 근거

- [ ] **Step 1: 전체 검증을 실행한다**

```powershell
npm.cmd run verify
```

Expected: ESLint, Prettier, 전체 Vitest, production build 모두 exit 0.

- [ ] **Step 2: 작업트리와 커밋 범위를 확인한다**

```powershell
git diff --check
git status --short
git log -3 --oneline
```

Expected: 추적되지 않은 production 파일 없음, 요청 범위 밖 변경 없음.
