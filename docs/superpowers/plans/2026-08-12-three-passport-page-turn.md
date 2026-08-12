# Three.js Passport Page Turn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인과 햄버거 메뉴의 Boarding 진입을 기존 22~42 흐름에 연결하고, 여권 49~52에 Three.js CSS3DRenderer 기반 화살표·좌우 스와이프 페이지 전환을 추가한다.

**Architecture:** `PassportPage`는 기존 `step`·`sheet`와 최종 단계 확정만 소유한다. 새 `PassportPageTurn`이 CSS3DRenderer, React portal 두 면, 화살표, pointer gesture와 일시적 전환 상태를 한곳에서 관리하고 전환 완료 시 `onCommit(direction)`을 한 번 호출한다. 기존 `PassportSpread` 마크업과 53~55 시트는 그대로 재사용한다.

**Tech Stack:** React 19, React Router 7, Three.js `CSS3DRenderer`, JavaScript, SCSS Modules, Vitest, React Testing Library

## Global Constraints

- 작업 브랜치와 worktree는 `feat/passport-page-turn`, `C:\hackathon\.vite\passport-page-turn`을 사용한다.
- 새 런타임 dependency는 `three` 하나만 허용한다. React Three Fiber, Drei, shader, mesh, gesture·상태 라이브러리를 추가하지 않는다.
- 메인과 햄버거 메뉴의 Boarding은 모두 `/boarding-pass/intro`로 이동한다.
- 프레임 22~42 내부 구현과 프레임 53~55 시트 구조는 변경하지 않는다.
- `PASSPORT 확인`의 기존 세션 분기와 `/boarding-pass/passport` 라우트를 유지한다.
- 화살표와 스와이프 release는 하나의 `requestTurn(direction, options)` 경로를 사용하고 한 입력은 최대 한 단계만 확정한다. drag 중 시각 progress만 `applyProgress()`로 갱신한다.
- 스와이프 commit 기준은 렌더된 여권 폭의 25% 또는 24px 이상·평균 속도 `0.45px/ms` 이상이다.
- 화살표 settle은 480ms, 스와이프 취소 복귀는 220ms이다.
- `prefers-reduced-motion`, CSS 3D 미지원, renderer 초기화 실패에서는 즉시 단계 전환으로 fallback한다.
- 시각 대조는 브라우저와 운영체제 배율 100%, viewport 폭 `320`, `390`, `430px`에서 수행한다.
- 사용자 확대를 차단하거나 zoom 값을 감지해 강제로 fallback하지 않는다.
- 터치 영역 최소 44×44px, native button 키보드 동작, 진행률 `aria-valuenow`·`aria-valuetext`를 유지한다.
- 각 task는 RED 확인, 집중 테스트 GREEN, 독립 검토, 한글 커밋 순서로 끝낸다.
- 원격 push는 커밋·작업·검증 내역을 사용자에게 보고하고 명시적 허가를 받은 뒤에만 수행한다.

---

## File Structure

### 새 파일

- `src/pages/boarding-pass/passport/PassportPageTurn.jsx`: CSS3DRenderer 생명주기, 두 portal 면, 화살표, 전환 잠금, pointer gesture를 소유한다.
- `src/pages/boarding-pass/passport/PassportPageTurn.module.scss`: renderer viewport, portal face, 3D backface, 전환 그림자와 pointer 동작만 담당한다.
- `src/pages/boarding-pass/passport/PassportPageTurn.test.jsx`: renderer 성공·실패, 화살표, 스와이프, 경계, 중복 입력, reduced motion과 cleanup을 검증한다.

### 수정 파일

- `src/pages/home/HomePage.jsx`: 메인 Boarding 링크 경로만 수정한다.
- `src/shared/layout/store-menu/StoreMenu.jsx`: 메뉴 Boarding 카드 경로만 수정하고 기존 `onClose`를 유지한다.
- `src/app/App.test.jsx`: 두 Boarding 진입점의 실제 라우팅과 메뉴 닫힘을 검증한다.
- `package.json`, `package-lock.json`: `three` dependency만 추가한다.
- `src/pages/boarding-pass/passport/PassportPage.jsx`: 기존 `PassportSpread`를 `PassportPageTurn`의 `renderStep`으로 전달하고 완료 후 `step`을 확정한다.
- `src/pages/boarding-pass/passport/PassportPage.test.jsx`: renderer 실패 fallback에서 기존 49~55 DOM·라우팅·시트 회귀를 유지한다.
- `docs/frontend-development-plan.md`: 구현·시각 검증 후 `52:18864` 전환 프레임 P1 항목만 제거한다.

---

### Task 1: Boarding 진입 라우팅 연결

**Files:**
- Modify: `src/pages/home/HomePage.jsx:12-20`
- Modify: `src/shared/layout/store-menu/StoreMenu.jsx:30-57`
- Test: `src/app/App.test.jsx`

**Interfaces:**
- Consumes: 기존 `createAppRoutes()`, `StoreMenuProvider`, `/boarding-pass/intro` lazy route
- Produces: 메인과 메뉴에서 공통으로 `/boarding-pass/intro`에 진입하는 사용자 흐름

- [ ] **Step 1: 두 진입점의 실패하는 라우팅 테스트를 작성한다**

`src/app/App.test.jsx`의 메뉴 테스트 근처에 다음 두 테스트를 추가한다.

```jsx
it('메인 Boarding으로 보딩패스 인트로에 진입한다', async () => {
  const router = renderRoute('/')

  fireEvent.click(await screen.findByRole('link', { name: 'Boarding' }))

  expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/boarding-pass/intro')
})

it('메뉴 Boarding으로 인트로에 진입하며 메뉴를 닫는다', async () => {
  const router = renderRoute('/')

  fireEvent.click(await screen.findByRole('button', { name: '메뉴 열기' }))
  fireEvent.click(screen.getByRole('link', { name: 'MCM Boarding Pass 둘러보기' }))

  expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/boarding-pass/intro')
  expect(screen.queryByRole('dialog', { name: '전체 메뉴' })).not.toBeInTheDocument()
  expect(document.documentElement).not.toHaveClass('store-menu-open')
  expect(document.body).not.toHaveClass('store-menu-open')
})
```

- [ ] **Step 2: 집중 테스트가 현재 `/products` 이동 때문에 실패하는지 확인한다**

Run: `npm.cmd run test:run -- src/app/App.test.jsx`

Expected: 새 두 테스트가 상품 목록으로 이동해 `Next` 버튼과 `/boarding-pass/intro` 단언에서 FAIL한다.

- [ ] **Step 3: 두 링크의 목적지만 최소 수정한다**

`src/pages/home/HomePage.jsx`:

```jsx
<Link className={styles.boardingButton} to="/boarding-pass/intro">
```

`src/shared/layout/store-menu/StoreMenu.jsx`의 `BoardingCard`:

```jsx
<Link
  className={styles.contentGroup}
  to="/boarding-pass/intro"
  aria-label="MCM Boarding Pass 둘러보기"
  onClick={onClose}
>
```

같은 파일의 `CollectionCard`가 사용하는 `/products`는 변경하지 않는다. `src/app/router.jsx`에는 필요한 route가 이미 있으므로 수정하지 않는다.

- [ ] **Step 4: 라우팅 테스트와 diff 검사를 통과시킨다**

Run:

```powershell
npm.cmd run test:run -- src/app/App.test.jsx
git diff --check
```

Expected: `App.test.jsx` 전체 PASS, diff whitespace 오류 0건.

- [ ] **Step 5: 라우팅 기능 단위를 커밋한다**

```powershell
git add src/pages/home/HomePage.jsx src/shared/layout/store-menu/StoreMenu.jsx src/app/App.test.jsx
git commit -m "fix: 보딩패스 진입 라우팅 연결"
```

---

### Task 2: Three.js 화살표 페이지 전환

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/pages/boarding-pass/passport/PassportPageTurn.jsx`
- Create: `src/pages/boarding-pass/passport/PassportPageTurn.module.scss`
- Create: `src/pages/boarding-pass/passport/PassportPageTurn.test.jsx`
- Modify: `src/pages/boarding-pass/passport/PassportPage.jsx`
- Test: `src/pages/boarding-pass/passport/PassportPage.test.jsx`

**Interfaces:**
- Consumes: `step: 0 | 1 | 2 | 3`, `disabled: boolean`, `renderStep(step): ReactNode`
- Produces: `<PassportPageTurn step disabled onCommit renderStep />`
- Callback: `onCommit(direction)` receives exactly `-1` or `1` once after a committed turn
- DOM contract: every `PassportSpread` root has `data-passport-surface`; wrapper exposes `data-renderer="ready|fallback"` and `data-turn-state="idle|settling"`

- [ ] **Step 1: Three.js 한 개만 설치한다**

Run: `npm.cmd install three`

Expected: `dependencies`와 lockfile에 `three`만 추가된다. R3F, Drei, gesture package는 없어야 한다.

- [ ] **Step 2: 화살표 전환과 fallback의 실패 테스트를 작성한다**

`PassportPageTurn.test.jsx`의 renderer control과 harness는 다음 계약을 사용한다.

```jsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PassportPageTurn from './PassportPageTurn.jsx'

const rendererControl = vi.hoisted(() => ({
  fail: false,
  render: vi.fn(),
  domElement: null,
  disconnect: vi.fn(),
  cancelFrame: vi.fn(),
}))

vi.mock('three/addons/renderers/CSS3DRenderer.js', async (importOriginal) => {
  const actual = await importOriginal()

  class TestRenderer {
    constructor() {
      if (rendererControl.fail) throw new Error('renderer failed')
      this.domElement = document.createElement('div')
      rendererControl.domElement = this.domElement
    }

    setSize() {}

    render(scene, camera) {
      scene.traverse((object) => {
        if (object.element && !this.domElement.contains(object.element)) {
          this.domElement.append(object.element)
        }
      })
      rendererControl.render(scene, camera)
    }
  }

  return { ...actual, CSS3DRenderer: TestRenderer }
})

function TurnHarness({ disabled = false, initialStep = 0 }) {
  const [step, setStep] = useState(initialStep)

  return (
    <PassportPageTurn
      step={step}
      disabled={disabled}
      onCommit={(direction) => setStep((current) => current + direction)}
      renderStep={(visibleStep) => (
        <section data-passport-surface aria-label={`여권 ${visibleStep + 1}단계`}>
          Step {visibleStep + 1}
          {visibleStep === 1 ? <button type="button">제품 보기</button> : null}
        </section>
      )}
    />
  )
}
```

`beforeEach`에서 control mock을 초기화하고 fake timer를 사용한다. `requestAnimationFrame`은 16ms `setTimeout`, `cancelAnimationFrame`은 `rendererControl.cancelFrame`, `ResizeObserver.disconnect()`는 `rendererControl.disconnect`, `matchMedia`는 `matches: false`, `CSS.supports()`는 `true`로 stub한다. `afterEach`에서 timer와 global stub을 복원한다. 제품 CTA test는 native button의 `pointerDown`에서 시작하고 page turn이 시작되지 않는지 검증하며, native Enter·Space용 별도 `onKeyDown` handler는 구현하거나 테스트하지 않는다.

다음 세 동작을 테스트한다.

```jsx
it('다음 화살표 전환이 끝난 뒤 한 단계만 확정한다', async () => {
  render(<TurnHarness />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
  )

  fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  expect(screen.getByRole('button', { name: '다음 단계' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )

  await act(() => vi.advanceTimersByTimeAsync(500))
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
})

it('settling 중 중복 클릭으로 두 단계를 건너뛰지 않는다', async () => {
  render(<TurnHarness />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
  )
  const next = screen.getByRole('button', { name: '다음 단계' })

  fireEvent.click(next)
  fireEvent.click(next)
  await act(() => vi.advanceTimersByTimeAsync(500))

  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
})

it('renderer 초기화가 실패하면 즉시 전환한다', async () => {
  rendererControl.fail = true
  render(<TurnHarness />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'fallback'),
  )

  fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
})

it('unmount 시 observer, animation frame과 renderer DOM을 정리한다', async () => {
  const { unmount } = render(<TurnHarness />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
  )
  fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
  const rendererDom = rendererControl.domElement

  unmount()

  expect(rendererControl.disconnect).toHaveBeenCalledTimes(1)
  expect(rendererControl.cancelFrame).toHaveBeenCalled()
  expect(rendererDom).not.toBeInTheDocument()
})
```

- [ ] **Step 3: 새 컴포넌트가 없어서 RED인지 확인한다**

Run: `npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPageTurn.test.jsx`

Expected: `PassportPageTurn.jsx` module not found로 FAIL한다.

- [ ] **Step 4: CSS3DRenderer와 portal의 최소 생명주기를 구현한다**

`PassportPageTurn.jsx`의 import와 상수는 다음으로 고정한다.

```jsx
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Group, MathUtils, PerspectiveCamera, Scene } from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'

import navNext from '@/shared/assets/boarding-pass/guide/nav-next.svg'
import navPrev from '@/shared/assets/boarding-pass/guide/nav-prev.svg'

import pageStyles from './PassportPage.module.scss'
import styles from './PassportPageTurn.module.scss'

const LAST_STEP = 3
const COMMIT_DURATION = 480
```

컴포넌트 안의 ref가 renderer, scene, camera, pivot `Group`, current·target `CSS3DObject`, current·target host element, RAF id와 완료 여부를 소유한다. 별도 class, hook, context는 만들지 않는다.

mount layout effect의 순서는 다음과 같다.

1. `CSS.supports('transform-style', 'preserve-3d') === false`면 fallback 유지
2. `CSS3DRenderer`, `Scene`, `PerspectiveCamera(40, 1, 1, 4000)`, `Group` 생성
3. 두 `div` host를 `CSS3DObject`로 감싸 group에 추가
4. renderer DOM을 viewport에 append하고 `rendererMode = 'ready'`
5. `ResizeObserver`로 size와 pivot 재계산
6. 예외면 개발 환경에서 `console.warn` 후 fallback 유지
7. cleanup에서 observer disconnect, RAF cancel, renderer DOM remove, ref null 처리

size와 책등 pivot 계산은 다음 식을 사용한다.

```js
const viewportRect = viewport.getBoundingClientRect()
const surfaceRect = surface.getBoundingClientRect()
const width = Math.max(viewportRect.width, 1)
const height = Math.max(viewportRect.height, 1)
const pivotX =
  step === 0
    ? surfaceRect.left - viewportRect.left
    : surfaceRect.left - viewportRect.left + surfaceRect.width / 2
const cameraDistance = height / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)))

renderer.setSize(width, height)
camera.aspect = width / height
camera.position.set(0, 0, cameraDistance)
camera.updateProjectionMatrix()
pivot.position.x = pivotX - width / 2
currentObject.position.x = -pivot.position.x
targetObject.position.x = -pivot.position.x
renderer.render(scene, camera)
```

현재 면은 항상 portal로, target 면은 전환 중에만 portal로 렌더한다. target wrapper는 처음부터 `aria-hidden="true"`, `inert`, pointer 비활성 상태다. fallback이면 portal 대신 `renderStep(step)`을 일반 DOM으로 렌더한다.

- [ ] **Step 5: 단일 화살표 전환 함수를 구현한다**

`requestTurn(direction, options = {})`의 옵션 계약은 `{ fromProgress = 0, commit = true, duration = COMMIT_DURATION }`이다. `disabled`, `step + direction` 범위와 전환 잠금을 먼저 검사한다. Task 3의 drag release만 `turnState === 'dragging' && fromProgress > 0`에서 이미 준비된 target을 이어서 사용할 수 있고, 나머지 non-idle 요청은 무시한다. fallback 또는 reduced motion이면 `commit === true`일 때만 `onCommit(direction)`을 즉시 한 번 호출한다. renderer가 준비됐으면 target을 설정하거나 기존 drag target을 재사용하고 `settleTurn({ direction, fromProgress, toProgress: commit ? 1 : 0, duration, commit })`을 호출한다. target portal이 mount된 layout effect부터 다음 변형을 적용한다.

```js
targetObject.rotation.y = direction > 0 ? Math.PI : -Math.PI
pivot.rotation.y = -direction * Math.PI * progress
```

`settleTurn({ direction, fromProgress, toProgress, duration, commit })`은 RAF timestamp로 progress를 계산한다. 완료 프레임에서 `commit === true`일 때만 `onCommit(direction)`을 호출하고 target을 제거하며 pivot, 전환 잠금과 완료 ref를 초기화한다. 이전·다음 native button과 기존 progressbar를 이 컴포넌트가 렌더하고 두 button 모두 `requestTurn()`을 호출한다. nav의 접근성 계약은 기존과 동일하게 다음 값을 유지한다.

```jsx
const progress = (step + 1) * 25
const inputLocked = disabled || turnState !== 'idle'

<nav className={pageStyles.navigation} aria-label="여권 단계 이동">
  <button
    type="button"
    aria-label="이전 단계"
    aria-disabled={inputLocked || undefined}
    disabled={step === 0}
    onClick={() => requestTurn(-1)}
  >
    <img src={navPrev} alt="" />
  </button>
  <div
    role="progressbar"
    aria-label="여권 진행률"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={progress}
    aria-valuetext={`${step + 1}단계 / 4단계`}
    className={pageStyles.progress}
  >
    <span style={{ width: `${progress}%` }} />
  </div>
  <button
    type="button"
    aria-label="다음 단계"
    aria-disabled={inputLocked || undefined}
    disabled={step === LAST_STEP}
    onClick={() => requestTurn(1)}
  >
    <img src={navNext} alt="" />
  </button>
</nav>
```

- [ ] **Step 6: 기존 여권 DOM을 render prop으로 연결한다**

`PassportPage.jsx`에서 nav icon import와 기존 `<PassportSpread />`, `<nav>` 블록을 제거하고 같은 위치에 다음을 둔다.

```jsx
<PassportPageTurn
  step={step}
  disabled={Boolean(sheet)}
  onCommit={(direction) =>
    setStep((current) => Math.min(3, Math.max(0, current + direction)))
  }
  renderStep={(visibleStep) => (
    <PassportSpread
      step={visibleStep}
      onHistory={(event) => openSheet('history', event.currentTarget)}
      onTicket={(event) => openSheet('ticket', event.currentTarget)}
      onProducts={() => navigate('/products')}
    />
  )}
/>
```

`PassportSpread`가 반환하는 네 `<section>` 모두에 `data-passport-surface`를 추가한다. 기존 class, `aria-label`, 카피, 이미지와 CTA는 바꾸지 않는다.

`PassportPage.test.jsx`는 CSS3DRenderer constructor가 throw하는 mock을 추가해 기존 49~55 정지 상태 테스트가 즉시 fallback 경로를 사용하게 한다. 이 mock은 `importOriginal()`의 실제 `CSS3DObject` export를 유지해야 한다. expected fallback 경고는 `console.warn` spy로 숨기고 각 test 뒤 복원한다.

- [ ] **Step 7: renderer viewport SCSS를 작성한다**

`PassportPageTurn.module.scss`의 핵심 geometry는 다음과 같다.

```scss
.root {
  display: contents;
}

.viewport {
  position: relative;
  width: 100%;
  height: calc(2.25rem + min(79.5vw, 19.375rem) * 394 / 310);
  flex: 0 0 auto;
  overflow: visible;
  touch-action: pan-y;
}

.viewport[data-open='true'] {
  height: calc(2.25rem + 24.625rem);
}

.renderer {
  position: absolute;
  inset: 0;
  overflow: visible;
  transform-style: preserve-3d;
}

.host,
.face,
.fallback {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.face {
  backface-visibility: hidden;
}

.target {
  pointer-events: none;
}
```

320px media query에서는 기존 `.passport` margin 1.25rem을 사용해 viewport 높이의 2.25rem만 1.25rem으로 바꾼다. renderer DOM에 `.renderer`, 두 host에 `.host`, target host에 `.target`을 지정한다. 기존 `PassportPage.module.scss`의 정지 상태 위치와 크기 수치는 변경하지 않는다.

- [ ] **Step 8: core 전환과 기존 여권 테스트를 GREEN으로 만든다**

Run:

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPageTurn.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
npm.cmd run lint
git diff --check
```

Expected: 새 core tests와 기존 시트, 포커스 복원, 제품·닫기 라우팅, 4단계 정지 DOM tests 전체 PASS.

- [ ] **Step 9: Three.js core 기능을 커밋한다**

```powershell
git add package.json package-lock.json src/pages/boarding-pass/passport/PassportPage.jsx src/pages/boarding-pass/passport/PassportPageTurn.jsx src/pages/boarding-pass/passport/PassportPageTurn.module.scss src/pages/boarding-pass/passport/PassportPageTurn.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
git commit -m "feat: Three.js 여권 페이지 전환 구현"
```

---

### Task 3: 좌우 스와이프·모션 감소·접근성 보완

**Files:**
- Modify: `src/pages/boarding-pass/passport/PassportPageTurn.jsx`
- Modify: `src/pages/boarding-pass/passport/PassportPageTurn.module.scss`
- Test: `src/pages/boarding-pass/passport/PassportPageTurn.test.jsx`
- Test: `src/pages/boarding-pass/passport/PassportPage.test.jsx`

**Interfaces:**
- Consumes: Task 2의 `requestTurn(direction, { fromProgress, commit, duration })`, `settleTurn({ direction, fromProgress, toProgress, duration, commit })`, `onCommit(direction)`과 portal layer
- Produces: 여권 surface의 pointer drag, commit/cancel, `data-turn-state="dragging"`, reduced-motion와 disabled 입력 정책

- [ ] **Step 1: 스와이프 테스트 helper를 추가한다**

`PassportPageTurn.test.jsx`에 renderer 준비 후 사용할 다음 helper를 추가한다. `.viewport`에는 `data-testid="passport-turn-surface"`가 있어야 한다.

```jsx
function setSurfaceRect(width = 400) {
  const surface = screen.getByTestId('passport-turn-surface')
  vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 394,
    width,
    height: 394,
    toJSON() {},
  })
  return surface
}

async function finishAnimation(duration) {
  await act(() => vi.advanceTimersByTimeAsync(duration))
}
```

- [ ] **Step 2: 거리 commit·취소·역방향의 실패 테스트를 작성한다**

```jsx
it('여권 폭의 25%를 넘긴 왼쪽 스와이프로 다음 단계에 이동한다', async () => {
  render(<TurnHarness />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
  )
  const surface = setSurfaceRect()

  fireEvent.pointerDown(surface, {
    pointerId: 1,
    button: 0,
    isPrimary: true,
    clientX: 300,
    clientY: 100,
  })
  fireEvent.pointerMove(surface, { pointerId: 1, clientX: 190, clientY: 104 })
  fireEvent.pointerUp(surface, { pointerId: 1, clientX: 190, clientY: 104 })
  await finishAnimation(500)

  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
})

it('25% 미만의 느린 스와이프는 220ms 안에 원래 단계로 복귀한다', async () => {
  render(<TurnHarness />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
  )
  const surface = setSurfaceRect()

  fireEvent.pointerDown(surface, {
    pointerId: 2,
    button: 0,
    isPrimary: true,
    clientX: 300,
    clientY: 100,
  })
  await act(() => vi.advanceTimersByTimeAsync(300))
  fireEvent.pointerMove(surface, { pointerId: 2, clientX: 240, clientY: 102 })
  fireEvent.pointerUp(surface, { pointerId: 2, clientX: 240, clientY: 102 })
  await finishAnimation(240)

  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
})

it('오른쪽 스와이프로 이전 단계에 이동한다', async () => {
  render(<TurnHarness initialStep={1} />)
  await waitFor(() =>
    expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-renderer', 'ready'),
  )
  const surface = setSurfaceRect()

  fireEvent.pointerDown(surface, {
    pointerId: 3,
    button: 0,
    isPrimary: true,
    clientX: 100,
    clientY: 100,
  })
  fireEvent.pointerMove(surface, { pointerId: 3, clientX: 210, clientY: 104 })
  fireEvent.pointerUp(surface, { pointerId: 3, clientX: 210, clientY: 104 })
  await finishAnimation(500)

  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
})
```

- [ ] **Step 3: 속도·수직 제스처·pointer cancel·내부 CTA 제외 테스트를 작성한다**

빠른 스와이프 test는 `performance.now()`를 pointer down에서 `0`, release에서 `40`으로 stub하고 30px 이동해 `0.75px/ms`를 만든다. 25% 미만이어도 50% 단계로 이동해야 한다.

수직 제스처 test는 `dx = -10`, `dy = 50`으로 이동하고 `data-turn-state="idle"`, 진행률 25%를 단언한다. 내부 CTA test는 `TurnHarness initialStep={1}`의 `제품 보기` button에서 pointer down을 시작하고 page turn이 생기지 않는지 단언한다.

pointer cancel test의 실제 event와 기대값은 다음과 같다.

```jsx
fireEvent.pointerDown(surface, {
  pointerId: 4,
  button: 0,
  isPrimary: true,
  clientX: 300,
  clientY: 100,
})
fireEvent.pointerMove(surface, { pointerId: 4, clientX: 160, clientY: 100 })
fireEvent.pointerCancel(surface, { pointerId: 4 })
await finishAnimation(240)

expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
expect(screen.getByTestId('passport-turn')).toHaveAttribute('data-turn-state', 'idle')
```

- [ ] **Step 4: reduced motion·disabled·경계 테스트를 작성한다**

다음 동작을 각각 별도 test로 작성한다.

1. `matchMedia()`가 `matches: true`이면 다음 화살표 클릭 직후 25%에서 50%로 이동한다.
2. `matchMedia()`가 `matches: true`인 30% 왼쪽 스와이프는 release 직후 25%에서 50%로 이동하고 3D RAF를 예약하지 않는다.
3. `CSS.supports()`가 false면 `data-renderer="fallback"`이고 화살표가 즉시 한 단계만 이동한다.
4. `disabled` harness에서는 다음 화살표 클릭과 pointer down 모두 진행률 25%를 유지한다.
5. `initialStep={0}`은 이전 button, `initialStep={3}`은 다음 button이 native disabled이고, 각 경계에서 불가능한 방향의 pointer gesture도 `idle`과 현재 진행률을 유지한다.
6. 시트 disabled 상태와 동일하게 전환 중 target portal은 `aria-hidden="true"`, `inert`이며 현재 portal만 `여권 N단계` region으로 조회된다.

- [ ] **Step 5: 테스트가 gesture 부재로 RED인지 확인한다**

Run: `npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPageTurn.test.jsx`

Expected: pointer 이동 tests에서 진행률이 바뀌지 않고 `data-turn-state="dragging"`이 없어 FAIL한다.

- [ ] **Step 6: pointer gesture를 기존 전환 경로에 구현한다**

`PassportPageTurn.jsx` 안에만 다음 helper와 상수를 둔다.

```js
const DIRECTION_LOCK_PX = 8
const MIN_FAST_DISTANCE_PX = 24
const FAST_VELOCITY_PX_MS = 0.45
const CANCEL_DURATION = 220

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea'))
}

function shouldCommitTurn({ distance, elapsed, width }) {
  return (
    distance >= width * 0.25 ||
    (distance >= MIN_FAST_DISTANCE_PX &&
      distance / Math.max(elapsed, 1) >= FAST_VELOCITY_PX_MS)
  )
}
```

pointer ref shape은 다음으로 고정한다.

```js
const pointerRef = useRef({
  id: null,
  startX: 0,
  startY: 0,
  startedAt: 0,
  direction: null,
  progress: 0,
})
```

처리 순서는 다음과 같다.

1. pointer down은 primary pointer, 왼쪽 mouse button, 비상호작용 target, idle, 비disabled만 저장하고 `event.currentTarget.setPointerCapture?.(event.pointerId)`로 capture한다.
2. pointer move는 가로 8px 미만이면 대기하고 `abs(dy) >= abs(dx)`이면 page turn에서 제외한다.
3. 방향은 `dx < 0 ? 1 : -1`; 범위 안이면 target portal을 준비하고 `turnState = dragging`으로 설정한다.
4. progress는 `Math.min(abs(dx) / surfaceWidth, 1)`이며 Task 2와 같은 `applyProgress(direction, progress)`를 호출한다.
5. pointer up은 `shouldCommitTurn()` 결과를 `commit`으로 두고 `requestTurn(direction, { fromProgress: progress, commit, duration: commit ? COMMIT_DURATION : CANCEL_DURATION })`을 호출한다.
6. pointer cancel은 `requestTurn(direction, { fromProgress: progress, commit: false, duration: CANCEL_DURATION })`을 호출한다.
7. commit settle 완료만 `onCommit(direction)`을 호출한다. 모든 종료 경로에서 `event.currentTarget.releasePointerCapture?.(event.pointerId)`와 pointer ref를 초기화한다.

화살표와 pointer release 모두 `requestTurn(direction, options)`에 들어가고, 그 함수만 `settleTurn({ direction, fromProgress, toProgress, duration, commit })`을 호출한다. 단계 계산이나 `onCommit`을 pointer handler 안에 복제하지 않는다.

- [ ] **Step 7: 접근성 상태와 reduced motion을 적용한다**

- target portal wrapper에 `aria-hidden="true"`, `inert`, `pointer-events: none`
- 전환 중 현재 포커스 유지
- 화살표에 `aria-disabled={turnState !== 'idle' || disabled || undefined}`
- 첫·마지막 단계의 불가능한 방향만 native `disabled`
- `.viewport`에 `touch-action: pan-y`, `user-select: none`
- reduced motion에서는 drag visual을 생략하고 release 판정 후 즉시 commit 또는 cancel
- 그림자는 RAF progress로만 갱신하고 continuous render loop는 만들지 않음

- [ ] **Step 8: gesture와 기존 여권 테스트를 GREEN으로 만든다**

Run:

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPageTurn.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
npm.cmd run lint
git diff --check
```

Expected: 거리, 속도, 취소, 역방향, 경계, 중복, reduced motion, renderer fallback과 기존 53~55 시트 tests 전체 PASS.

- [ ] **Step 9: 스와이프 기능을 커밋한다**

```powershell
git add src/pages/boarding-pass/passport/PassportPageTurn.jsx src/pages/boarding-pass/passport/PassportPageTurn.module.scss src/pages/boarding-pass/passport/PassportPageTurn.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
git commit -m "feat: 여권 좌우 스와이프와 접근성 보완"
```

---

### Task 4: Figma 전환 검증과 백로그 정리

**Files:**
- Modify only on measured static regression: `src/pages/boarding-pass/passport/PassportPageTurn.module.scss`
- Modify only on measured static regression: `src/pages/boarding-pass/passport/PassportPage.module.scss`
- Modify: `docs/frontend-development-plan.md`
- Verify: Figma nodes `52:18494`, `52:18588`, `52:18724`, `52:18864`, `52:19004`, `52:19144`, `52:19302`, `52:19464`

**Interfaces:**
- Consumes: Task 3의 최종 4단계·3시트, `data-turn-state`, `data-renderer`
- Produces: 320·390·430px 시각 증거, overflow·containment 측정, 완료된 `52:18864` 백로그 상태

- [ ] **Step 1: 전체 자동 검증을 먼저 실행한다**

Run: `npm.cmd run verify`

Expected: ESLint, Prettier, 모든 Vitest와 production build exit 0. 기존 Tailwind raw directive 경고는 별도 P0로 유지하며 이번 task에 섞지 않는다.

- [ ] **Step 2: Figma 기준 이미지를 정확한 노드에서 다시 확보한다**

Figma MCP로 각 node의 `get_design_context`를 읽은 뒤 같은 node의 `get_screenshot`을 확보한다. `52:18864`는 profile→stamps 전환 50% 상태의 기준으로 사용한다. 임시 Figma asset URL은 코드나 문서에 저장하지 않는다.

- [ ] **Step 3: 로컬 앱의 24개 상태를 캡처한다**

Run:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

브라우저 profile은 저장소 밖 임시 경로를 사용한다. 폭 320, 390, 430px마다 cover, profile, stamps, journey, history sheet, detail sheet, ticket sheet와 profile→stamps drag 50%를 캡처한다.

각 캡처에서 다음 값을 기록한다.

```js
({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  renderer: document.querySelector('[data-testid="passport-turn"]')?.dataset.renderer,
  turnState: document.querySelector('[data-testid="passport-turn"]')?.dataset.turnState,
  dialogContained: (() => {
    const screen = document.querySelector('[data-device-screen]')?.getBoundingClientRect()
    const dialog = document.querySelector('[role="dialog"]')?.getBoundingClientRect()
    return !dialog || !screen || (dialog.left >= screen.left && dialog.right <= screen.right)
  })(),
})
```

Expected: 모든 폭에서 `horizontalOverflow: false`, 시트는 `dialogContained: true`, settled state는 `renderer: 'ready'`, `turnState: 'idle'`이다.

- [ ] **Step 4: 정지 상태와 전환 상태를 판정한다**

- 49·50·51·52 settled 화면은 기존 Figma의 위치, 크기, clipping, 카피와 CTA를 유지한다.
- 50% drag는 `52:18864`처럼 책등이 고정되고 현재 면이 회전하며 target 면이 뒤에서 보여야 한다.
- Chrome, 닫기, progress와 nav 위치는 전환 중 움직이지 않는다.
- target 면 텍스트와 button은 접근성 트리와 pointer 대상에서 제외된다.

정지 geometry가 달라졌다면 새 renderer wrapper의 높이와 pivot 계산만 수정한다. 기존 `PassportSpread` 내부 수치, 카피, asset과 53~55 sheet SCSS는 변경하지 않는다. 수정 후 Task 3 집중 테스트와 전체 24개 캡처를 다시 실행한다. 기준을 만족하지 못하면 백로그를 제거하거나 완료 커밋을 만들지 않고 실패한 width와 state를 보고한다.

- [ ] **Step 5: 실제 모바일 브라우저 smoke test를 수행한다**

같은 네트워크의 기기에서 접근할 때만 dev server를 `npm.cmd run dev -- --host 0.0.0.0 --port 4173`으로 다시 시작한다. 현재 Android Chrome과 가능한 iOS Safari·카카오·네이버 인앱 브라우저에서 다음 한 경로를 반복한다.

1. `/`의 Boarding과 햄버거 메뉴 Boarding이 각각 `/boarding-pass/intro`를 연다.
2. `/boarding-pass/passport`에서 화살표로 49→50→51→52를 이동하고 이전 화살표로 49까지 돌아간다.
3. 같은 왕복을 좌우 스와이프로 반복하며 한 제스처가 한 단계만 이동하는지 확인한다.
4. 세로 제스처가 page turn으로 오인되지 않고, 제품 CTA와 history·detail·ticket 시트가 기존대로 동작하는지 확인한다.

브라우저 이름·버전·폭·성공 여부를 Task 4 검증 기록에 남긴다. 실제 기기를 확보하지 못한 브라우저는 통과로 간주하지 않고 최종 보고에 `미검증`으로 명시한다. 사용자 확대는 차단하지 않고, 100%가 아닌 zoom의 픽셀 일치는 판정 대상에서 제외한다.

- [ ] **Step 6: 완료된 전환 백로그 한 줄만 제거한다**

`docs/frontend-development-plan.md` §20에서 다음 행만 삭제한다.

```markdown
| P1 | 여권 여행 기록 전환 프레임 | Figma `52:18864`; 현재 구현은 최종 상태 `52:19004` 기준 | 좌우 페이지 전환 상태를 디자인과 동일하게 추가 |
```

다른 P0·P1·P2와 API 대기 항목은 수정하지 않는다.

- [ ] **Step 7: 최종 검증을 새로 실행한다**

Run:

```powershell
npm.cmd run verify
git diff --check
git status --short
```

Expected: verify exit 0, diff whitespace 오류 0건, 의도한 SCSS와 백로그 문서 외 변경 없음.

- [ ] **Step 8: 발생한 시각 보정과 문서를 최소 단위로 커밋한다**

SCSS 수정이 실제로 발생한 경우에만 먼저 커밋한다.

```powershell
git add src/pages/boarding-pass/passport/PassportPageTurn.module.scss src/pages/boarding-pass/passport/PassportPage.module.scss
git commit -m "fix: 여권 페이지 전환 시각 보정"
```

문서는 별도 커밋한다.

```powershell
git add docs/frontend-development-plan.md
git commit -m "docs: 여권 페이지 전환 백로그 완료 처리"
```

- [ ] **Step 9: 최종 독립 검토를 요청한다**

검토자에게 설계 문서, 이 계획, `develop...HEAD` diff, 새 `npm run verify` 출력과 320·390·430px 캡처를 제공한다. 검토 범위는 라우팅 correctness, renderer cleanup, 한 입력 한 단계, 접근성 DOM 중복, mobile overflow와 과잉 구현이다. Critical 또는 Important finding은 별도 fix 커밋으로 처리하고 전체 검증을 다시 실행한다.

---

## Completion Handoff

구현이 끝나면 다음 내용을 사용자에게 먼저 보고한다.

- 작업 브랜치와 커밋 목록·한글 메시지
- 변경한 라우팅과 Three.js 전환 범위
- 자동 테스트 수와 `npm run verify` 결과
- 320·390·430px 및 Figma `52:18864` 시각 검증 결과
- 남은 Tailwind P0와 API 연동 백로그

사용자가 push를 명시적으로 허가하기 전에는 원격 push나 PR 갱신을 수행하지 않는다.
