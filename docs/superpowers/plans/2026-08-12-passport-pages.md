# Digital Passport Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Figma 48~55 범위의 보딩패스 랜딩과 디지털 여권 4단계·여행 기록 3개 시트를 구현하고, 설계 범위 밖의 잔여 화면·상호작용을 미구현 문서에 기록한다.

**Architecture:** `/boarding-pass/passport` 한 라우트에서 `step`과 `sheet` 두 로컬 상태만 사용한다. 화면 데이터는 `passportData.js`의 정적 모델로 공급하고, 기존 `BoardingPassChrome`, `BoardingTicketCard`, 보딩패스 아이콘·색상 토큰을 재사용한다. 인증과 실제 API는 건드리지 않고 랜딩·비행 종료의 라우팅만 연결한다.

**Tech Stack:** React 19, React Router 7, JavaScript, SCSS Modules, Tailwind CSS 4, Vitest, Testing Library, Vite 8

## Global Constraints

- 기준 Figma viewport는 `390×844`, 반응형 검증 폭은 `320`, `390`, `430px`다.
- 모바일 브라우저 자체 상태 표시줄은 DOM으로 구현하지 않는다.
- 데스크톱에서는 기획된 `MobileShell` 휴대폰 외형을 유지한다.
- 새 npm 의존성, 전역 상태, 캐러셀 라이브러리, API/MSW endpoint를 추가하지 않는다.
- 실제 로그인·Bearer token·여권 API 연동은 전체 화면 구현이 끝난 뒤 별도 작업으로 진행한다.
- 인터랙션은 키보드와 터치에서 동작해야 하며, 최소 터치 영역은 `44×44px`다.
- Figma 원본 자산은 로컬 정적 파일로 저장하고 만료되는 Figma URL을 런타임 코드에 남기지 않는다.
- 커밋은 최소 기능 단위로 나누고 `<tag>: <한글 메시지>` 형식을 사용한다.
- 원격 push는 커밋·작업 내용·메시지를 사용자에게 보고하고 허가받은 뒤에만 수행한다.

---

## File Map

- Create `src/pages/boarding-pass/passport/PassportPage.jsx`: 네 단계 전환, 진행률, 시트 상태, 닫기·Escape·포커스 동작을 소유한다.
- Create `src/pages/boarding-pass/passport/PassportPage.module.scss`: 여권 책자, 단계별 지면, 진행 바, 바텀시트와 320~430px 반응형을 표현한다.
- Create `src/pages/boarding-pass/passport/passportData.js`: 프로필, 크레딧, 스탬프, 여행 기록, 티켓 mock 모델을 내보낸다.
- Create `src/pages/boarding-pass/passport/PassportPage.test.jsx`: 단계 경계, 진행률, 라우팅, 시트 전환과 접근성을 검증한다.
- Create `src/shared/assets/boarding-pass/passport/*`: Figma 49~55에서 내려받은 표지·책자·매장·스탬프·장식 원본만 둔다.
- Modify `src/shared/assets/boarding-pass/assets-manifest.md`: 새 여권 자산의 최신 Figma node와 용도를 append한다.
- Modify `src/app/router.jsx`: `/boarding-pass/passport` lazy route를 추가한다.
- Modify `src/app/App.test.jsx`: 새 라우트 smoke case를 추가한다.
- Modify `src/pages/boarding-pass/landing/LandingPage.jsx`: Passport CTA를 인증 경계 뒤 실제 라우팅으로 바꾸고 랜딩 전용 chrome 높이를 전달한다.
- Modify `src/pages/boarding-pass/landing/LandingPage.module.scss`: Figma 48의 비행기·글로우·CTA 간격과 랜딩 전용 아이콘 바 높이를 맞춘다.
- Create `src/pages/boarding-pass/landing/LandingPage.test.jsx`: 인증 여부에 따른 Passport 이동을 검증한다.
- Modify `src/pages/boarding-pass/flight/FlightPage.jsx`: `비행 종료`를 `/boarding-pass` 이동 버튼으로 바꾼다.
- Create `src/pages/boarding-pass/flight/FlightPage.test.jsx`: 비행 종료 라우팅을 검증한다.
- Modify `docs/frontend-development-plan.md`: 기존 20절을 최신 Figma의 추가 전환 프레임과 설계 제외·기존 deferred 동작을 담은 후속 백로그로 갱신한다.

---

### Task 1: 통합 기준선 설치와 검증

**Files:**
- Verify: `package.json`
- Verify: `package-lock.json`

**Interfaces:**
- Consumes: `fix/boarding-pass-final`의 보딩패스 구현과 로컬 `develop`의 7개 커밋
- Produces: `merge: develop 최신 변경사항 통합` merge commit이 포함된 검증 가능한 작업 기준선

- [x] **Step 1: 격리 worktree와 기능 브랜치를 만든다**

```powershell
git worktree add .vite/passport-pages -b feat/passport-pages fix/boarding-pass-final
```

- [x] **Step 2: develop을 일반 merge한다**

```powershell
git merge --no-ff develop -m "merge: develop 최신 변경사항 통합"
```

- [ ] **Step 3: 잠금 파일 기준으로 의존성을 설치한다**

```powershell
npm.cmd ci
```

- [ ] **Step 4: 통합 직후 전체 기준선을 검증한다**

```powershell
npm.cmd run verify
```

Expected: ESLint, Prettier, 전체 Vitest, production build가 모두 exit code 0이다.

---

### Task 2: 디지털 여권 4단계와 라우트

**Files:**
- Create: `src/pages/boarding-pass/passport/passportData.js`
- Create: `src/pages/boarding-pass/passport/PassportPage.jsx`
- Create: `src/pages/boarding-pass/passport/PassportPage.module.scss`
- Create: `src/pages/boarding-pass/passport/PassportPage.test.jsx`
- Create: `src/shared/assets/boarding-pass/passport/passport-cover.png`
- Create: `src/shared/assets/boarding-pass/passport/passport-spread.png`
- Create: `src/shared/assets/boarding-pass/passport/mcm-haus.png`
- Create: `src/shared/assets/boarding-pass/passport/passport-stamps.png`
- Create: `src/shared/assets/boarding-pass/passport/journey-decoration.png`
- Modify: `src/shared/assets/boarding-pass/assets-manifest.md`
- Modify: `src/app/router.jsx`
- Modify: `src/app/App.test.jsx`

**Interfaces:**
- Consumes: `BoardingPassChrome(props)`, `useBagHandlers()`, `useNavigate()`, Figma nodes `52:18494`, `52:18588`, `52:18724`, `52:19004`
- Produces: `Component()` lazy route export, `passportProfile`, `passportStamps`, `journeyRecords`, `passportTicket`

- [x] **Step 1: 라우트와 단계 동작의 실패 테스트를 작성한다**

```jsx
it('25%에서 시작해 네 단계 사이만 이동한다', async () => {
  renderPassport()

  const progress = screen.getByRole('progressbar', { name: '여권 진행률' })
  expect(progress).toHaveAttribute('aria-valuenow', '25')
  expect(screen.getByRole('button', { name: '이전 단계' })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
  expect(progress).toHaveAttribute('aria-valuenow', '50')
  fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))
  expect(progress).toHaveAttribute('aria-valuenow', '75')
  fireEvent.click(screen.getByRole('button', { name: '다음 단계' }))

  expect(progress).toHaveAttribute('aria-valuenow', '100')
  expect(screen.getByRole('button', { name: '다음 단계' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '상품 보러가기' })).toBeInTheDocument()
})
```

`renderPassport()`는 `createMemoryRouter`로 `/boarding-pass/passport`, `/boarding-pass`, `/products` 세 경로를 만들고 `AppProviders` 안에서 렌더한다. `useBagHandlers`는 `{}`를 반환하도록 모킹한다.

- [x] **Step 2: 테스트가 새 라우트와 컴포넌트 부재로 실패하는지 확인한다**

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPage.test.jsx src/app/App.test.jsx
```

Expected: `PassportPage.jsx` 또는 `/boarding-pass/passport` 라우트를 찾지 못해 FAIL한다.

- [x] **Step 3: Figma 자산을 내려받아 의미 있는 로컬 이름으로 저장한다**

Figma `download_assets`를 `52:18494`, `52:18588`, `52:18724`, `52:19004`에 호출하고 다음 기준으로 저장한다.

```text
passport-cover.png      = 표지의 갈색 Visetos 여권 원본
passport-spread.png     = 열린 여권 책자/종이 원본
mcm-haus.png            = 프로필 면의 MCM HAUS 매장 사진
passport-stamps.png     = 스탬프 면의 장식 묶음
journey-decoration.png  = 여행 기록 면의 비행기·건물 장식
```

동일 원본 해시의 파일은 한 번만 저장하고 기존 `icons/close.svg`, `guide/nav-prev.svg`, `guide/nav-next.svg`는 복제하지 않는다.

- [x] **Step 4: 정적 여권 모델을 구현한다**

```js
export const passportProfile = {
  passportNumber: 'MCM 2026 0805',
  surname: 'LIM',
  givenName: 'YEONJU',
  nationality: 'REPUBLIC OF KOREA',
  issueDate: '05 AUG 2026',
  credit: 100,
  visits: 6,
}

export const passportStamps = [
  { id: 'stamp-1', floor: '1F', date: '05 AUG 2026' },
  { id: 'stamp-2', floor: '2F', date: '05 AUG 2026' },
  { id: 'stamp-3', floor: '3F', date: '05 AUG 2026' },
  { id: 'stamp-4', floor: '1F', date: '25 AUG 2026' },
  { id: 'stamp-5', floor: '2F', date: '25 AUG 2026' },
  { id: 'stamp-6', floor: '3F', date: '25 AUG 2026' },
]

export const journeyRecords = [
  { id: 'journey', floor: '1F JOURNEY', title: 'MCM HAUS', date: '25 AUG 2026' },
  { id: 'emblem', floor: '2F EMBLEM', title: 'BRAND ARCHIVE', date: '25 AUG 2026' },
  { id: 'try', floor: '3F TRY', title: 'AI FITTING', date: '25 AUG 2026' },
]
```

`passportTicket`은 `BoardingTicketCard`가 이미 소비하는 `passengerName`, `flightCode`, `cabinClass`, `from`, `to`, `gate`, `boardingLabel`, `timeStart`, `timeEnd`, `passCode` 필드를 같은 파일에서 내보낸다.

- [x] **Step 5: 네 단계 상태와 라우트를 최소 구현한다**

```jsx
export function Component() {
  const navigate = useNavigate()
  const bagHandlers = useBagHandlers()
  const [step, setStep] = useState(0)
  const progress = (step + 1) * 25

  return (
    <div className={styles.page}>
      <BoardingPassChrome {...bagHandlers} />
      <section className={styles.stage} aria-labelledby="passport-title">
        <button type="button" aria-label="닫기" onClick={() => navigate('/boarding-pass')}>
          <img src={closeIcon} alt="" />
        </button>
        <h2 id="passport-title" className={styles.srOnly}>MCM PASSPORT</h2>
        <PassportSpread step={step} />
        <div
          role="progressbar"
          aria-label="여권 진행률"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
          className={styles.progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <nav className={styles.navigation} aria-label="여권 단계 이동">
          <button
            type="button"
            aria-label="이전 단계"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          />
          <button
            type="button"
            aria-label="다음 단계"
            disabled={step === 3}
            onClick={() => setStep((current) => Math.min(3, current + 1))}
          />
        </nav>
      </section>
    </div>
  )
}
```

`PassportSpread`는 `step`에 따라 표지, 프로필/크레딧, 방문 스탬프, 여행 기록 중 하나만 렌더한다. 마지막 단계의 `상품 보러가기`는 `navigate('/products')`를 호출한다.

- [x] **Step 6: Figma 치수에 맞춰 SCSS를 구현한다**

```scss
.stage {
  position: relative;
  display: flex;
  min-height: calc(var(--mcm-viewport-stable) - 5.6875rem);
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 1rem 1.25rem max(1.5rem, var(--mcm-safe-bottom));
  background: #41210b;
}

.passport {
  width: min(100%, 21.875rem);
  margin: auto;
  aspect-ratio: 350 / 452;
}

.navigation button {
  width: 2.75rem;
  height: 2.75rem;
}

@media (max-width: 22rem) {
  .stage { padding-inline: 0.75rem; }
  .passport { width: min(100%, 19rem); }
}
```

정적 이미지 위 이름·국적·날짜·크레딧·버튼을 DOM 텍스트로 배치하고, 이미지 자체에 포함된 동일 텍스트는 배경 장식으로만 사용한다.

- [x] **Step 7: 단계·라우트 테스트를 통과시킨다**

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPage.test.jsx src/app/App.test.jsx
```

Expected: 새 테스트와 기존 앱 라우트 테스트가 모두 PASS한다.

- [x] **Step 8: 기본 여권 기능을 커밋한다**

```powershell
git add src/pages/boarding-pass/passport src/shared/assets/boarding-pass/passport src/shared/assets/boarding-pass/assets-manifest.md src/app/router.jsx src/app/App.test.jsx
git commit -m "feat: 디지털 여권 기본 화면과 단계 이동 구현"
```

---

### Task 3: 여행 기록·상세·티켓 바텀시트

**Files:**
- Modify: `src/pages/boarding-pass/passport/PassportPage.jsx`
- Modify: `src/pages/boarding-pass/passport/PassportPage.module.scss`
- Modify: `src/pages/boarding-pass/passport/PassportPage.test.jsx`

**Interfaces:**
- Consumes: Task 2의 `journeyRecords`, `passportTicket`, 기존 `BoardingTicketCard({ pass, size, className })`
- Produces: `sheet = null | 'history' | 'history-detail' | 'ticket'` 전환과 접근 가능한 modal dialog

- [x] **Step 1: 시트 흐름과 닫기 동작의 실패 테스트를 작성한다**

```jsx
it('여행 기록에서 1F 상세와 티켓을 열고 Escape로 닫는다', async () => {
  renderPassport()
  const nextButton = screen.getByRole('button', { name: '다음 단계' })
  fireEvent.click(nextButton)
  fireEvent.click(nextButton)
  fireEvent.click(nextButton)

  const historyTrigger = screen.getByRole('button', { name: '여행 기록 보기' })
  fireEvent.click(historyTrigger)
  expect(screen.getByRole('dialog', { name: '여행 기록' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' })).toHaveFocus()

  fireEvent.click(screen.getByRole('button', { name: '1F JOURNEY 상세 보기' }))
  expect(screen.getByRole('dialog', { name: '1F JOURNEY 상세' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '티켓 보기' }))
  expect(screen.getByRole('dialog', { name: '탑승권' })).toBeInTheDocument()

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(historyTrigger).toHaveFocus()
})
```

별도 테스트에서 시트가 열린 동안 배경이 `inert`인지, 상단 닫기 버튼이 시트만 닫고 페이지에 머무는지, 시트가 없을 때 상단 닫기가 `/boarding-pass`로 이동하는지 검증한다.

- [x] **Step 2: 테스트가 dialog 부재로 실패하는지 확인한다**

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPage.test.jsx
```

Expected: `여행 기록` dialog를 찾지 못해 FAIL한다.

- [x] **Step 3: 단일 sheet 상태와 포커스 복원을 구현한다**

```jsx
const [sheet, setSheet] = useState(null)
const dialogRef = useRef(null)
const sheetTriggerRef = useRef(null)

function openSheet(nextSheet, trigger) {
  if (!sheet) sheetTriggerRef.current = trigger
  setSheet(nextSheet)
}

function closeSheet() {
  setSheet(null)
  requestAnimationFrame(() => sheetTriggerRef.current?.focus())
}

useEffect(() => {
  if (!sheet) return undefined
  dialogRef.current?.querySelector('button')?.focus()
  const onKeyDown = (event) => {
    if (event.key !== 'Escape') return
    setSheet(null)
    requestAnimationFrame(() => sheetTriggerRef.current?.focus())
  }
  document.addEventListener('keydown', onKeyDown)
  return () => document.removeEventListener('keydown', onKeyDown)
}, [sheet])
```

상단 닫기는 `sheet ? closeSheet() : navigate('/boarding-pass')`로 분기한다. 닫기 버튼은 inert 영역 밖에 두고, 나머지 배경 래퍼에는 `inert={sheet ? '' : undefined}`를 준다. progressbar 상태를 숨길 필요가 없으므로 `aria-hidden`은 추가하지 않는다.

- [x] **Step 4: 세 dialog를 같은 바텀시트 틀로 렌더한다**

```jsx
{sheet ? (
  <div className={styles.sheetRoot}>
    <button type="button" aria-label="시트 배경 닫기" className={styles.scrim} onClick={closeSheet} />
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={sheetLabels[sheet]}
      className={styles.sheet}
    >
      {sheet === 'history' ? <HistoryList onSelectJourney={(event) => openSheet('history-detail', event.currentTarget)} /> : null}
      {sheet === 'history-detail' ? <JourneyDetail onTicket={(event) => openSheet('ticket', event.currentTarget)} /> : null}
      {sheet === 'ticket' ? <BoardingTicketCard pass={passportTicket} size="md" /> : null}
    </section>
  </div>
) : null}
```

2F·3F 카드는 세부 디자인이 없으므로 일반 정보 카드로만 렌더하고 클릭 가능한 가짜 버튼을 만들지 않는다.

- [x] **Step 5: Figma 53~55의 시트 크기와 안전영역을 구현한다**

```scss
.sheetRoot {
  position: absolute;
  inset: 0;
  z-index: 50;
}

.sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  width: min(100%, var(--mcm-shell-max));
  max-height: calc(var(--mcm-viewport-stable) - 6rem);
  margin: 0 auto;
  overflow-y: auto;
  padding: 0.75rem 1.25rem max(2rem, var(--mcm-safe-bottom));
  border-radius: 1.875rem 1.875rem 0 0;
  background: #894a26;
  box-shadow: 0 -0.625rem 1.875rem rgba(0, 0, 0, 0.2);
}
```

- [x] **Step 6: 시트 테스트를 통과시킨다**

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/passport/PassportPage.test.jsx
```

Expected: 단계와 세 dialog 테스트가 모두 PASS한다.

- [x] **Step 7: 시트 기능을 커밋한다**

```powershell
git add src/pages/boarding-pass/passport
git commit -m "feat: 여권 여행 기록과 티켓 시트 구현"
```

---

### Task 4: 랜딩 시각 보정과 여권·비행 종료 동선

**Files:**
- Modify: `src/pages/boarding-pass/landing/LandingPage.jsx`
- Modify: `src/pages/boarding-pass/landing/LandingPage.module.scss`
- Create: `src/pages/boarding-pass/landing/LandingPage.test.jsx`
- Modify: `src/pages/boarding-pass/flight/FlightPage.jsx`
- Create: `src/pages/boarding-pass/flight/FlightPage.test.jsx`

**Interfaces:**
- Consumes: 기존 `requireAuthOr(action)`, `useNavigate()`, Figma node `52:18416`
- Produces: 인증된 Passport 이동, 비인증 로그인 이동, 비행 종료 후 랜딩 이동

- [x] **Step 1: Passport 인증 경계와 비행 종료의 실패 테스트를 작성한다**

```jsx
it('인증 사용자는 Passport로 이동한다', async () => {
  mockSession.isAuthenticated = true
  const router = renderLanding()
  fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT 확인' }))
  expect(router.state.location.pathname).toBe('/boarding-pass/passport')
})

it('비인증 사용자는 로그인으로 이동한다', async () => {
  mockSession.isAuthenticated = false
  const router = renderLanding()
  fireEvent.click(await screen.findByRole('button', { name: 'PASSPORT 확인' }))
  expect(router.state.location.pathname).toBe('/login')
})

it('비행 종료 후 보딩패스 랜딩으로 이동한다', async () => {
  const router = renderFlight()
  fireEvent.click(await screen.findByRole('button', { name: '비행 종료' }))
  expect(router.state.location.pathname).toBe('/boarding-pass')
})
```

- [x] **Step 2: DeferredButton 때문에 테스트가 실패하는지 확인한다**

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/landing/LandingPage.test.jsx src/pages/boarding-pass/flight/FlightPage.test.jsx
```

Expected: 두 버튼이 경로를 변경하지 않아 FAIL한다.

- [x] **Step 3: 두 placeholder를 기본 button과 기존 navigate 흐름으로 교체한다**

```jsx
<button
  type="button"
  className={styles.secondaryCta}
  onClick={() => requireAuthOr(() => navigate('/boarding-pass/passport'))}
>
  <span className={styles.secondaryCtaLabel}>PASSPORT 확인</span>
</button>
```

```jsx
<button type="button" onClick={() => navigate('/boarding-pass')} className={styles.actionBtn}>
  비행 종료
</button>
```

두 파일에서 더 이상 쓰지 않는 `DeferredButton` import를 삭제한다. Flight의 음성 도슨트와 이전·다음 placeholder는 이번 기능과 독립적이므로 유지한다.

- [x] **Step 4: 랜딩만 Figma 48 치수로 보정한다**

`BoardingPassChrome` 호출에 `iconRowClassName={styles.iconRow}`를 추가하고 다음 SCSS를 적용한다.

```scss
.iconRow {
  height: 3.375rem !important;
}

.stage {
  min-height: calc(var(--mcm-viewport-stable) - 6.0625rem);
}

.planeWrap {
  height: 13.0625rem;
  margin-top: 2.25rem;
  margin-bottom: 2.25rem;
}

.planeFrame {
  width: min(15.375rem, 100%);
  aspect-ratio: 246 / 209;
}
```

글로우는 동일 이미지 복제와 CSS filter를 유지하되 Figma 캡처에 맞춰 과도한 `scale`과 blur만 줄인다. 공통 `BoardingPassChrome` 자체의 높이는 수정하지 않는다.

- [x] **Step 5: 라우팅 테스트와 관련 회귀 테스트를 통과시킨다**

```powershell
npm.cmd run test:run -- src/pages/boarding-pass/landing/LandingPage.test.jsx src/pages/boarding-pass/flight/FlightPage.test.jsx src/pages/boarding-pass/passport/PassportPage.test.jsx
```

Expected: 인증·비인증·비행 종료 동선과 여권 회귀 테스트가 모두 PASS한다.

- [x] **Step 6: 동선과 시각 보정을 커밋한다**

```powershell
git add src/pages/boarding-pass/landing src/pages/boarding-pass/flight
git commit -m "fix: 보딩패스 랜딩과 여권 진입 흐름 보정"
```

---

### Task 5: 미구현 항목 기록과 최종 검증

**Files:**
- Modify: `docs/frontend-development-plan.md`
- Modify: `docs/superpowers/plans/2026-08-12-passport-pages.md`

**Interfaces:**
- Consumes: 실제 구현 결과와 최신 Figma node 목록
- Produces: 화면 구현 이후 API 연동 전 남은 프론트엔드 작업의 단일 기준 문서

- [x] **Step 1: 미구현 문서를 실제 근거와 함께 작성한다**

```markdown
## 20. 현재 미구현 및 후속 백로그

## 디자인 상태

| 우선순위 | 항목 | 근거 | 완료 조건 |
| --- | --- | --- | --- |
| P1 | 여권 여행 기록 전환 프레임 | Figma `52:18864`; 이번 구현은 최종 상태 `52:19004`를 기준으로 함 | 좌우 페이지 전환 상태를 디자인과 동일하게 추가 |
| P1 | 스캔 실패·재시도 UI | `ScanPage.jsx`가 실패를 조용히 무시함 | 업무 실패와 네트워크 실패에서 오류 안내·재시도 제공 |
| P2 | Flight 이전·다음 진행 | `FlightPage.jsx`의 두 nav 버튼이 경로·상태를 변경하지 않음 | 단계 상태와 진행률이 실제로 변경 |
| P2 | 음성 도슨트 실제 재생 | `FlightPage.jsx`, `GuidePage.jsx`는 재생 상태만 토글 | 음원 정책 확정 후 재생·정지 연결 |
| P2 | 보딩패스 메뉴·검색 | `BoardingPassChrome.jsx`의 `D-04` | 기획된 메뉴와 검색 화면으로 이동 |
| P2 | 빈 위시리스트·쇼핑백의 상품 이동 | `EmptyBagToast.jsx`의 `D-06` | 토스트 CTA로 상품 목록 이동 |
| P2 | 데이터가 있는 위시리스트·쇼핑백 이동 | `useBagHandlers.jsx`의 `D-07` | 비어 있지 않은 경우 각 페이지로 이동 |

## API 연동 대기

- 카카오 로그인, token 저장·Authorization header
- 상품·상세·위시리스트·쇼핑백·착용 API
- 설문·Boarding Pass 발급·최근 탑승권·스캔 계약 정렬
- 여권 프로필·방문·크레딧·여행 기록 API
- 여권 공유·다운로드·Wallet 저장과 2F·3F 여행 상세
- 공식 리세일 서비스
```

이미 구현한 Figma 48~55 최종 상태는 이 문서의 미구현 표에 넣지 않는다.

- [x] **Step 2: 구현 계획 체크박스를 실제 결과에 맞게 갱신한다**

완료한 Step만 `[x]`로 바꾸고, 실행하지 못한 검증은 `[ ]`로 남기며 바로 아래에 원인을 한 문장으로 기록한다.

- [x] **Step 3: 320·390·430px 레이아웃을 확인한다**

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

각 폭에서 `/boarding-pass`, `/boarding-pass/passport`의 네 단계와 세 시트를 확인한다. 가로 overflow, 텍스트 잘림, 버튼 겹침, 시트의 MobileShell 이탈이 없어야 한다.

- [x] **Step 4: 전체 자동 검증을 실행한다**

```powershell
npm.cmd run verify
git diff --check
```

Expected: lint, format, 전체 tests, production build, whitespace 검사가 모두 exit code 0이다.

- [x] **Step 5: 미구현 문서를 커밋한다**

```powershell
git add docs/frontend-development-plan.md docs/superpowers/plans/2026-08-12-passport-pages.md
git commit -m "docs: 프론트엔드 미구현 항목 정리"
```

- [x] **Step 6: PR 브랜치 통합 전 사용자에게 보고한다**

보고에는 merge commit과 세 기능·문서 커밋, 변경 파일 요약, 자동·수동 검증 결과, 미구현 P1/P2 목록을 포함한다. `fix/boarding-pass-final` 통합과 원격 push는 사용자 허가 후에만 수행한다.
