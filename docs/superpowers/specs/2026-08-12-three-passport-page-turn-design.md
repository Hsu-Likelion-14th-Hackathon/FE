# Three.js 여권 페이지 전환 및 보딩 진입 라우팅 설계

## 1. 목표

메인 랜딩과 햄버거 메뉴의 `Boarding` 진입점을 이미 구현된 Boarding Pass 22~42 흐름에 연결하고, `PASSPORT 확인` 이후의 49~52 여권 단계를 Three.js 기반 3D 페이지 전환으로 연출한다.

기존 여권의 텍스트, 버튼, 진행률, 여행 기록·티켓 시트와 향후 API 교체가 가능한 DOM 구조는 유지한다. Three.js는 시각 전환에만 사용하며 실제 종이가 휘는 WebGL 시뮬레이션은 만들지 않는다.

## 2. 기준 디자인

- Figma 파일: `aklj7UjNcG6PDFJVRU9JXv`
- Boarding Pass 흐름: 프레임 22~42
- 여권 표지: `52:18494`
- 여권 프로필: `52:18588`
- 방문 스탬프: `52:18724`
- 페이지 전환 중간 상태: `52:18864`
- 여행 기록: `52:19004`
- 여행 기록 시트: `52:19144`
- 여행 기록 상세 시트: `52:19302`
- 티켓 시트: `52:19464`
- 기준 viewport: `390×844`
- 반응형 검증 폭: `320`, `390`, `430px`

상태 표시줄은 웹 DOM에 추가하지 않고 기기 safe-area를 사용한다. 데스크톱의 휴대폰 외형은 기존 기획대로 유지한다.

## 3. 범위

### 포함

- 메인 랜딩의 `Boarding` 링크를 `/boarding-pass/intro`로 변경
- 햄버거 메뉴의 Boarding 카드 링크를 `/boarding-pass/intro`로 변경하고 기존 메뉴 닫기 동작 유지
- 기존 `PASSPORT 확인` 인증 분기와 `/boarding-pass/passport` 이동 유지
- 여권 49→50 표지 열기 전환
- 여권 50↔51↔52 양방향 페이지 전환
- 이전·다음 화살표와 좌우 스와이프
- 모션 감소 설정과 Three.js 초기화 실패 시 즉시 전환 fallback
- 라우팅, 전환 상태, 접근성, 반응형 회귀 테스트

### 제외

- 이미 구현된 Boarding Pass 22~42 내부 화면과 상태의 재작성
- 53~55 여행 기록·상세·티켓 시트 구조 변경
- WebGL mesh, shader, 실제 종이 굽힘 또는 물리 시뮬레이션
- React Three Fiber, Drei, gesture 라이브러리, 전역 상태 라이브러리 추가
- Passport 직접 URL의 새 인증 가드
- 여권·방문 기록 API 연동

## 4. 라우팅

| 진입점 | 현재 | 목표 |
| --- | --- | --- |
| 메인 랜딩 `Boarding` | `/products` | `/boarding-pass/intro` |
| 햄버거 메뉴 Boarding 카드 | `/products` | `/boarding-pass/intro` |
| Boarding Pass 랜딩 `PASSPORT 확인` | 인증 후 `/boarding-pass/passport` | 기존 동작 유지 |

`/boarding-pass/intro`부터 프레임 22~42의 기존 라우트와 상태 전환을 그대로 사용한다. 새 라우트는 만들지 않는다. 햄버거 메뉴에서 이동할 때는 링크의 기존 `onClose`를 유지해 목적지 화면 위에 메뉴가 남지 않게 한다.

`PASSPORT 확인`은 세션이 로딩 중이면 이동하지 않고, 비회원이면 `/login`, 인증된 사용자면 `/boarding-pass/passport`로 이동한다. 이번 작업은 직접 URL 접근 정책을 변경하지 않는다.

## 5. 기술 선택

Three.js의 공식 `CSS3DRenderer`를 사용한다. CSS3DRenderer는 실제 DOM 요소에 Three.js의 계층형 3D 변환을 적용하므로 텍스트 선명도와 DOM 기반 접근성을 유지할 수 있다.

- 추가 dependency: `three` 하나
- 사용 모듈: Three.js scene/camera와 `three/addons/renderers/CSS3DRenderer.js`
- 사용하지 않는 것: WebGLRenderer, canvas texture, mesh, shader, React Three Fiber, Drei
- 참고: [Three.js CSS3DRenderer 공식 문서](https://threejs.org/docs/pages/CSS3DRenderer.html)

CSS3DRenderer는 geometry/material 기반 종이 굽힘을 지원하지 않는다. 이번 완료 기준은 책장이 축을 중심으로 자연스럽게 회전하고 앞·뒷면과 그림자가 일관되게 보이는 3D page flip이다.

## 6. 구성과 책임

### `PassportPage`

- `step`과 `sheet`의 단일 소유자
- 인증 이후 진입한 여권 화면의 라우팅과 시트 제어
- 전환 완료 신호를 받은 경우에만 `step` 확정
- 시트가 열려 있을 때 페이지 전환 입력 비활성화

### 여권 단계 콘텐츠

현재 `PassportSpread`의 네 단계 마크업을 단계 콘텐츠로 유지한다. CSS3DRenderer가 소유하는 빈 element에 React `createPortal`로 현재 단계 DOM을 렌더한다. 기존 DOM을 CSS3DObject가 직접 재부모화하지 않는다. 이는 React의 이벤트 위임과 cleanup 경계를 보존한다.

전환 중에는 현재 단계와 인접 단계 두 개만 portal로 렌더한다. 현재 단계만 접근성 트리와 포커스 대상에 남기고, 인접 단계는 `aria-hidden="true"`와 `inert`로 차단한다. 별도의 숨은 대체 DOM이나 시각 전용 문자열·API 모델은 만들지 않는다.

### CSS3D 전환 레이어

- CSS3DRenderer, scene, camera, 현재 면과 대상 면의 CSS3DObject를 소유
- 현재 단계 portal을 평상시에도 표시하고 전환 중에만 인접 단계 portal을 추가
- 페이지 앞면에는 현재 단계, 뒷면 또는 아래 면에는 대상 단계를 렌더
- 회전축은 여권 책등에 맞춘 세로축
- 드래그 거리와 애니메이션 진행률을 같은 `0..1` 값으로 변환
- 완료 또는 취소 후 인접 단계 portal과 animation frame을 제거

Three.js 객체는 React의 화면 상태를 소유하지 않는다. `step`, 이동 가능 범위, 시트 상태는 React가 판단하고 Three.js는 전달받은 전환만 표현한다.

## 7. 상태 모델

기존 상태를 유지하고 짧은 전환 상태만 추가한다.

```text
step: 0 | 1 | 2 | 3
sheet: null | history | history-detail | ticket
turn: idle | dragging | settling
direction: -1 | 1 | null
```

- `step 0`: 표지, 25%
- `step 1`: 프로필, 50%
- `step 2`: 방문 스탬프, 75%
- `step 3`: 여행 기록, 100%
- 다음 방향은 `1`, 이전 방향은 `-1`
- `step + direction`이 `0..3` 밖이면 전환을 시작하지 않음
- `settling` 중에는 화살표, pointer, 추가 commit을 무시
- 전환 성공 시 `step`을 한 번만 변경하고 `idle`로 복귀
- 전환 취소 시 `step`을 변경하지 않고 `idle`로 복귀

49→50은 표지가 책등을 기준으로 열리는 전환으로 표현한다. 50↔51↔52는 같은 전환 엔진에서 페이지 앞·뒷면과 회전 방향만 바꾼다. 53~55는 기존 `sheet` 상태로 유지한다.

## 8. 화살표와 스와이프 규칙

화살표와 스와이프는 하나의 `requestTurn(direction)` 경로를 사용한다.

- 왼쪽 스와이프: 다음 단계
- 오른쪽 스와이프: 이전 단계
- 여권 표면에서 시작한 primary pointer만 받고 mouse는 왼쪽 버튼만 허용
- 버튼·링크 등 내부 조작 요소에서 시작한 pointer는 page turn으로 해석하지 않음
- pointer event를 사용해 mouse, touch, pen을 한 경로로 처리
- pointer capture로 화면 밖으로 이동해도 현재 제스처를 마무리
- `touch-action: pan-y`로 세로 브라우저 제스처를 보존
- 최초 이동이 가로 8px 이상이고 가로 이동량이 세로 이동량보다 클 때만 page turn으로 잠금
- 렌더된 여권 표면 폭의 25% 이상 이동하면 commit
- 24px 이상 이동하면서 pointer down부터 release까지의 평균 속도가 `0.45px/ms` 이상이면 거리와 무관하게 commit
- 조건 미달이면 원래 단계로 복귀
- commit settle은 480ms, 취소 복귀는 220ms
- 경계 단계의 불가능한 방향은 제스처를 시작하지 않으며 기존 화살표 disabled 상태를 유지

드래그 중 회전각과 그림자는 진행률에 따라 갱신한다. 상시 render loop는 두지 않고 pointer 이동, settle animation, resize 시점에만 렌더한다.

## 9. 접근성과 fallback

- 현재 단계 portal은 실제 정보 DOM이며 접근성 트리에 남긴다.
- 전환 중 추가된 인접 단계 portal은 `aria-hidden="true"`와 `inert`로 중복 읽기와 포커스를 차단한다.
- 현재 단계와 전환을 시작한 화살표의 포커스는 이동시키지 않는다.
- 전환 중 화살표에는 `aria-disabled="true"`를 표시하고 상태 가드로 추가 요청을 무시한다. 첫·마지막 단계의 불가능한 방향에는 기존 native `disabled`를 유지한다.
- 화살표는 기존 native `button`, 접근 가능한 이름, 44×44px 터치 영역을 유지한다.
- native button 활성화를 사용하며 Enter·Space용 중복 `keydown` handler는 추가하지 않는다.
- 진행률의 `aria-valuenow`, `aria-valuetext`는 전환 완료 후 확정된 `step` 기준으로 갱신한다.
- 스와이프는 보조 입력이며 동일 기능을 화살표만으로 수행할 수 있다.

`prefers-reduced-motion: reduce`에서는 드래그 중 3D 변형과 settle 애니메이션을 표시하지 않는다. 화살표는 즉시 이동하고, 스와이프는 동일한 거리·속도 판정 후 즉시 한 단계만 변경한다.

`transform-style: preserve-3d`를 지원하지 않거나 CSS3DRenderer 초기화가 실패하면 portal을 사용하지 않는 기존 `PassportSpread` DOM을 보여주고 화살표·스와이프 결과를 즉시 반영한다. 초기화 실패 때문에 화면이나 라우팅이 막혀서는 안 된다.

## 10. 생명주기와 성능

- Passport 라우트가 이미 lazy loading되므로 `three`는 해당 라우트 chunk에만 포함한다.
- 대상 단계 DOM은 `dragging` 또는 `settling` 동안만 추가한다.
- continuous animation loop를 사용하지 않는다.
- `ResizeObserver`로 여권 영역 크기가 바뀔 때 renderer와 camera를 갱신한다.
- unmount 시 pointer capture, event listener, ResizeObserver, requestAnimationFrame, renderer DOM을 모두 정리한다.
- `will-change`는 전환 중인 면에만 적용한다.
- 320~430px에서는 기존 여권 비율과 clipping 규칙을 유지한다.

CSS3DRenderer 공식 제약에 따라 픽셀 단위 시각 대조는 브라우저와 운영체제 배율 100%에서 수행한다. 사용자 확대는 차단하거나 배율을 감지해 강제로 fallback하지 않으며, 100%가 아닌 배율의 3D 픽셀 일치는 완료 기준에서 제외한다.

## 11. 오류 처리

- Three.js 초기화 실패: 개발 환경에서 경고를 남기고 즉시 전환 fallback 사용
- 전환 중 컴포넌트 unmount: 예약된 animation frame을 취소하고 상태 갱신 금지
- pointer cancel 또는 브라우저 제스처 전환: 현재 page turn 취소 후 원래 단계 복귀
- 시트가 열림: 진행 중 전환을 취소하고 시트 조작을 우선

사용자에게 별도 오류 화면을 노출하지 않는다. Three.js는 시각 향상 기능이므로 실패해도 기존 여권 기능은 계속 사용할 수 있어야 한다.

## 12. 테스트와 시각 검증

### 라우팅 회귀 테스트

- 메인 랜딩 `Boarding` 클릭 시 `/boarding-pass/intro`
- 햄버거 메뉴 Boarding 카드 클릭 시 메뉴가 닫히고 `/boarding-pass/intro`
- 인증 사용자 `PASSPORT 확인` 클릭 시 `/boarding-pass/passport`
- 비회원은 `/login`, 세션 로딩 중에는 이동하지 않음
- 프레임 22~42의 기존 라우트 테스트 유지

### 전환 테스트

- 화살표로 정확히 한 단계 전진·후진
- 25% 이상 왼쪽 스와이프로 다음 단계 commit
- 25% 이상 오른쪽 스와이프로 이전 단계 commit
- 빠른 스와이프의 속도 기준 commit
- 기준 미달 스와이프 취소와 단계 유지
- 첫·마지막 단계의 경계 제한
- settling 중 중복 입력으로 두 단계 건너뛰지 않음
- pointer cancel 시 원상 복귀
- reduced motion에서 애니메이션 없이 한 단계만 변경
- 시트가 열린 동안 page turn이 시작되지 않음
- Three.js 초기화 실패 fallback에서도 단계 이동 가능

jsdom에서는 여권 영역의 `getBoundingClientRect()`를 고정해 거리 판정을 검증하고, Three.js 내부 구현보다 사용자에게 보이는 진행률과 단계 콘텐츠를 단언한다.

### 시각·기기 검증

- Figma 49~52와 390px 정지 상태 재대조
- Figma `52:18864`와 제어된 중간 drag 상태 대조
- 320, 390, 430px에서 4단계와 전환 중간 상태 캡처
- 가로 overflow, 여권 clipping, Chrome·닫기·네비게이션 위치, 시트 containment 확인
- 현재 Chromium 계열과 실제 iOS Safari, 카카오·네이버 인앱 브라우저에서 화살표·스와이프 smoke test

전체 완료 전 다음 명령을 통과해야 한다.

```bash
npm run verify
```

## 13. 문서와 백로그 정리

구현과 시각 검증이 끝나면 `docs/frontend-development-plan.md`의 `여권 여행 기록 전환 프레임` P1 항목을 완료 처리하거나 제거한다. Tailwind 빌드 파이프라인과 API 연동 등 다른 백로그는 이번 작업에 섞지 않는다.

## 14. 완료 기준

- 두 Boarding 진입점이 모두 `/boarding-pass/intro`로 연결됨
- 기존 22~42 흐름과 53~55 시트가 회귀 없이 유지됨
- 49→50과 50↔51↔52가 화살표와 좌우 스와이프로 동작함
- 한 입력이 최대 한 단계만 변경함
- reduced motion과 Three.js 실패 fallback에서 전체 기능 사용 가능
- 실제 정보 DOM과 키보드 접근성이 유지됨
- 320~430px에서 가로 overflow와 콘텐츠 잘림 없음
- Figma 정지·중간 전환 상태 검증 완료
- lint, format, 전체 테스트, production build 통과
