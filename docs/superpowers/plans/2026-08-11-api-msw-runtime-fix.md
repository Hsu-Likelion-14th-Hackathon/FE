# API·MSW Runtime Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배포 API 요청에 백엔드 base URL을 적용하고 MSW 실패와 비활성화가 앱 렌더링을 막지 않게 한다.

**Architecture:** API와 mock handler가 공유하는 `API` 상수에서 URL을 한 번만 완성한다. 앱 진입점은 MSW 준비를 기다리되 실패를 흡수한 다음 기존 React root를 렌더링한다.

**Tech Stack:** React 19, Vite 8, Vitest 4, MSW 2.15, JavaScript

## Global Constraints

- 새 의존성을 추가하지 않는다.
- `public/mockServiceWorker.js`는 설치 시 생성되는 기존 방식을 유지한다.
- `VITE_ENABLE_MSW`는 문자열 `'true'`일 때만 활성화한다.
- 각 동작은 실패 테스트를 먼저 확인한 뒤 최소 코드로 통과시킨다.

---

### Task 1: API base URL 적용

**Files:**
- Modify: `src/shared/api/endpoints.js`
- Create: `src/shared/api/endpoints.test.js`

**Interfaces:**
- Consumes: `import.meta.env.VITE_API_BASE_URL`, 기존 상대 API 경로
- Produces: API 호출 코드와 MSW handler가 공유하는 완성된 `API` URL 문자열

- [ ] **Step 1: base URL과 trailing slash를 재현하는 실패 테스트 작성**

```js
test('base URL 뒤의 슬래시를 제거해 API 경로를 결합한다', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  const { API } = await import('./endpoints.js')
  expect(API.session).toBe('https://api.example.test/api/session')
})
```

- [ ] **Step 2: RED 확인**

Run: `npm.cmd run test:run -- src/shared/api/endpoints.test.js`

Expected: `API.session`이 `/api/session`이어서 실패한다.

- [ ] **Step 3: URL을 한 번만 조립하는 최소 구현**

```js
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const apiUrl = (path) => `${API_BASE_URL}${path}`
```

기존 `API` 객체의 일곱 경로를 `apiUrl('/api/...')`로 감싼다.

- [ ] **Step 4: GREEN 확인**

Run: `npm.cmd run test:run -- src/shared/api/endpoints.test.js`

Expected: 테스트가 통과한다.

- [ ] **Step 5: 기능 단위 커밋**

```bash
git add src/shared/api/endpoints.js src/shared/api/endpoints.test.js
git commit -m "fix: API 베이스 URL 적용"
```

### Task 2: MSW 토글과 렌더 복구

**Files:**
- Modify: `src/main.jsx`
- Create: `src/main.test.jsx`

**Interfaces:**
- Consumes: `import.meta.env.DEV`, `import.meta.env.VITE_ENABLE_MSW`, `worker.start()`
- Produces: MSW 활성화 여부와 무관하게 한 번 실행되는 React render

- [ ] **Step 1: 비활성화와 시작 실패를 재현하는 테스트 작성**

```js
test('MSW가 비활성화되면 worker를 시작하지 않고 렌더링한다', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false')
  await import('./main.jsx')
  await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
  expect(start).not.toHaveBeenCalled()
})

test('MSW 시작이 실패해도 앱을 렌더링한다', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'true')
  start.mockRejectedValueOnce(new Error('worker failed'))
  await import('./main.jsx')
  await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
})
```

- [ ] **Step 2: RED 확인**

Run: `npm.cmd run test:run -- src/main.test.jsx`

Expected: 비활성화 테스트에서는 `start`가 호출되고, 실패 테스트에서는 `render`가 호출되지 않아 실패한다.

- [ ] **Step 3: 최소 조건과 fail-open 구현**

```js
if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW !== 'true') return

enableMocking()
  .catch((error) => console.warn('MSW 시작 실패, 실제 API를 사용합니다.', error))
  .then(renderApp)
```

기존 JSX 렌더 블록만 `renderApp` 함수로 옮긴다.

- [ ] **Step 4: GREEN 및 전체 회귀 검증**

Run: `npm.cmd run test:run -- src/main.test.jsx`

Expected: 두 테스트가 통과한다.

Run: `npm.cmd run verify`

Expected: lint, format check, 전체 테스트, production build가 모두 exit code 0이다.

- [ ] **Step 5: 기능 단위 커밋**

```bash
git add src/main.jsx src/main.test.jsx
git commit -m "fix: MSW 실패 시 앱 렌더링 복구"
```
