# API·MSW 런타임 수정 설계

## 목표

Vercel 배포에서는 백엔드 API 호스트로 요청하고, 로컬 개발에서는 명시적으로 활성화한 MSW를 사용하되 MSW 시작 실패가 앱 렌더링을 막지 않도록 한다.

## 결정

- `src/shared/api/endpoints.js`에서 `VITE_API_BASE_URL`의 끝 `/`를 제거하고 모든 API 경로와 결합한다.
- API 호출 코드와 MSW handler가 이미 같은 `API` 상수를 사용하므로 별도 proxy나 handler 변환 계층은 추가하지 않는다.
- MSW는 `DEV && VITE_ENABLE_MSW === 'true'`일 때만 시작한다.
- MSW import 또는 시작이 실패하면 경고를 남기고 기존 React 렌더링을 계속한다.
- `public/mockServiceWorker.js`는 MSW 2.15의 `postinstall`과 `package.json`의 `msw.workerDirectory` 설정으로 생성되므로 Git에 추적하지 않는다.

## 제외한 접근

- `client.js`에서 URL을 조립하고 모든 MSW handler를 wildcard로 바꾸는 방식은 수정 파일이 늘어난다.
- Vercel rewrite를 API proxy로 사용하는 방식은 로컬·Preview·Production 동작을 배포 설정에 결합한다.
- timeout, retry, 별도 bootstrap 서비스는 현재 실패 복구 요구에 필요하지 않다.

## 오류 처리

- API 응답 오류 처리는 기존 `apiFetch` 계약을 유지한다.
- MSW 실패는 개발 보조 기능의 실패이므로 앱을 중단하지 않고 실제 네트워크 요청으로 전환한다.

## 검증

- base URL 설정 및 끝 `/` 정규화 후 API 요청 URL을 단위 테스트한다.
- MSW 비활성화 시 worker를 시작하지 않는지 검증한다.
- worker 시작 실패 시에도 React render가 호출되는지 검증한다.
- `npm run verify`로 lint, format, 전체 테스트, production build를 확인한다.

