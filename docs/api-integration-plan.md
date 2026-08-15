# API 통합 상세 실행 계획서

> **2026-08-16 갱신**: 이 문서는 2026-08-15 시점의 설계 검토본이다. 진행 현황과
> 남은 작업·블로커는 [api-integration-backlog.md](./api-integration-backlog.md)가
> 현행 문서다. 인증·상품·위시리스트·쇼핑백·AI 피팅·여권 연동 완료.
>
> 상태: 라이브 Swagger 반영 설계 검토본 · 2026-08-15  
> 대상: React 19 + Vite 8 프런트엔드와 라이브 Swagger·`docs/api` 명세의 통합  
> Swagger 기준: OpenAPI 3.1.0 · API 1.0.0 · 27 paths · 백엔드 31 operations  
> 구현 체크리스트: 이 설계의 사용자 검토 승인 후 같은 문서에 이어서 작성

## 1. 목적과 범위

이 문서는 [라이브 Swagger UI](https://boardingpass.p-e.kr/swagger-ui/index.html#/)와 [OpenAPI JSON](https://boardingpass.p-e.kr/v3/api-docs), `docs/api`의 Markdown 35개와 CSV 색인 2개를 전수 분석하고, 현재 프런트엔드 구현과 비교해 실제 API 통합 순서·경계·위험·완료 조건을 정의한다.

- 실제 통합 대상: Swagger 백엔드 API 31개 + Azure SAS 직접 업로드 1개 = 32개
- 통합 제외: 계약이 없는 문서 3개
  - `제목 없음` 시작 전 문서
  - 테스트 Bearer 토큰 메모 문서
  - 프로젝트와 무관한 Notion OAuth 예시가 든 `새 엔드포인트`
- 프런트 범위: API 클라이언트, 인증, 상품, 위시리스트, 쇼핑백, Boarding Pass, Travel Guide, Passport, 이미지 업로드, AI 피팅, MSW, 테스트, 배포 검증
- 백엔드 범위: 계약 확인 요청과 차단사항 기록까지. 백엔드 구현 변경은 이 계획의 실행 범위가 아니다.

### 1.1 계약 출처와 해석 규칙

1. 현재 method/path와 성공 DTO 구조·enum은 2026-08-15에 조회한 라이브 OpenAPI를 기준으로 한다.
2. Swagger에 없는 business rule과 4xx 오류 code는 로컬 Markdown을 보조 계약으로 사용하되, 서로 충돌하면 단계 0에서 백엔드 확인 후 고정한다.
3. Azure SAS URL 직접 PUT은 BoardingPass 서버가 아닌 외부 호출이므로 Swagger operation 수에 포함하지 않는다.
4. 사용자가 추가 예정이라고 확인한 `GET /passport`의 `birthDate`는 **목표 계약**으로 기록한다. 현재 Swagger에 아직 없는 사실과 배포 확인 조건을 함께 유지한다.
5. Swagger response DTO는 `required`와 nullable 선언이 부족하므로 그대로 타입을 자동 생성하지 않고 작은 수동 mapper에서 방어한다.

## 2. 결정 요약

통합 방식은 **공통 계약 기반 + 기능 흐름별 수직 통합**으로 확정한다.

1. 공통 클라이언트·토큰·오류·엔드포인트만 먼저 바로잡는다.
2. 인증 → 상품/위시/쇼핑백 → Boarding Pass → Travel Guide/Passport → AI 피팅 순으로 진행한다.
3. 각 흐름은 API 함수, DTO 변환, MSW, 화면 상태, 테스트까지 한 번에 완료한다.
4. 새 서버 상태 라이브러리나 폼 라이브러리를 추가하지 않는다. 기존 `fetch`, React state/effect, MSW, Vitest를 사용한다.
5. 백엔드 DTO는 페이지에서 직접 사용하지 않는다. 각 도메인 API 파일의 작은 변환 함수가 현재 화면 모델을 만든다.
6. 실제 계약과 다른 정적 fixture는 프로덕션 fallback으로 남기지 않는다. 디자인 전용 상수만 명시적으로 유지한다.

이 방식은 32개 API를 먼저 한꺼번에 만드는 방식보다 실제 사용자 흐름을 일찍 검증할 수 있고, 화면마다 클라이언트 로직을 중복하는 방식보다 계약 드리프트를 줄인다.

검토한 다른 방식은 채택하지 않는다.

| 방식 | 장점 | 채택하지 않은 이유 |
| --- | --- | --- |
| 전체 API 함수를 먼저 만드는 수평 통합 | endpoint 누락을 빠르게 채울 수 있음 | 화면에서 실제로 쓰기 전까지 DTO·상태 전이 오류가 늦게 발견됨 |
| 페이지별 직접 `fetch` | 첫 화면 연결은 빠름 | Bearer, envelope, 오류, 취소, ID 변환이 페이지마다 반복됨 |
| 공통 기반 후 수직 통합 | 공통 계약을 한 번만 구현하고 흐름별로 즉시 검증 | **채택**. 현재 규모에서 가장 작은 구조로 회귀 범위를 제한함 |

## 3. 현재 구현 진단

| 영역 | 현재 상태 | 통합 영향 |
| --- | --- | --- |
| 공통 클라이언트 | `apiFetch`가 성공 envelope를 그대로 반환하고 오류 body를 버림 | `result`를 화면이 잘못 읽고 백엔드 오류 code별 안내가 불가능 |
| 토큰 | 메모리와 개발용 `VITE_BEARER_TOKEN`만 사용 | 새로고침 시 로그인 소실, 만료·401 공통 처리 없음 |
| 엔드포인트 | `/session`, `/cart`, `/boarding-pass/scan` 사용 | `/session`은 명세에 없고, 쇼핑백·스캔 경로는 명세와 불일치 |
| 인증 화면 | 로그인·회원가입 제출과 카카오 버튼이 API 미연동 | 가입의 이메일/비밀번호 → 추가 프로필 2단계 흐름이 화면과 다름 |
| 상품 | 로컬 `products.js`와 문자열 ID 사용 | API의 숫자 `productId/productColorId/productSizeId`와 충돌 |
| 위시/쇼핑백 | API 조회 함수는 있으나 화면에서 미사용, mutation 없음 | 현재 화면 변화는 새로고침 시 사라지는 로컬 state |
| Boarding Pass | 설문/발급/latest/scan 일부 함수만 존재 | envelope, 설문 6문항, `dataConsent`, 스캔 경로·응답이 모두 불일치 |
| Travel Guide | 층·콘텐츠·추천 동선이 정적 데이터 | `/floors`, `/route` 미연동 |
| Passport | 여권·스탬프는 부분 매핑, 상세·크레딧은 화면 미연동 | 정적 fallback이 실서버 오류를 가리고 현재 `/passport`에는 추가 예정인 `birthDate`가 아직 없음 |
| AI 피팅 | 파일명과 가짜 진행률만 표시 | SAS 업로드, 피팅 생성, 2초 polling, 결과 이미지 모두 미연동 |
| MSW | 일부 GET만 처리하고 공통 envelope와 다른 응답 사용 | 실제 서버에서만 깨질 계약 오류를 mock이 숨김 |

## 4. API 전체 인벤토리

### 4.1 인증·회원·프로필 — 7개

| API | 인증 | 핵심 요청 | 핵심 `result` | 소비 화면 |
| --- | --- | --- | --- | --- |
| `POST /auth/login` | 불필요 | `email`, `password` | `accessToken`, `userId` | 로그인 |
| `POST /auth/signup` | 불필요 | `email`, `password` | `accessToken`, `userId` | 일반 회원가입 1단계 |
| `POST /auth/kakao` | 불필요 | `code`, `redirectUri` | `accessToken`, `isNewUser`, `userId` | 카카오 callback |
| `POST /auth/profile` | 필요 | `name`, `birthDate`, `nationality` | 회원 정보, `passportNo` | 신규 회원 추가정보 |
| `GET /users/me` | 필요 | 없음 | 회원·provider·기본 바디 이미지 | 세션 복원, 프로필 |
| `PATCH /users/me` | 필요 | `name`·`birthDate`·`nationality` 모두 필수(부분 수정 불가) | 갱신 회원 정보 | Passport 신분 정보 수정 |
| `DELETE /users/me/body-image` | 필요 | 없음 | `deleted` | 기본 이미지 관리 |

### 4.2 상품·위시리스트·쇼핑백 — 8개

| API | 인증 | 핵심 요청/식별자 | 핵심 `result` | 소비 화면 |
| --- | --- | --- | --- | --- |
| `GET /products` | 필요 | 선택 query `sort`, `size` | 색상별 카드 후보 배열 | 상품 목록 |
| `GET /products/{productId}` | 필요 | 숫자 `productId` | 색상·이미지·사이즈 중첩 상세 | 상품 상세, 피팅 |
| `GET /wishlist` | 필요 | 없음 | `items`, `totalCount` | 위시리스트 |
| `POST /wishlist` | 필요 | `productColorId` | 추가된 색상 상품 | 목록·상세 하트 |
| `DELETE /wishlist/{productColorId}` | 필요 | 숫자 `productColorId` | `removed` | 목록·상세·위시 삭제 |
| `GET /shopping-bag` | 필요 | 없음 | `items`, `totalCount` | 쇼핑백 |
| `POST /shopping-bag` | 필요 | `productSizeId` | 추가된 쇼핑백 항목 | 상품 상세 |
| `DELETE /shopping-bag/{shoppingBagItemId}` | 필요 | 숫자 항목 ID | `removed` | 쇼핑백 삭제 |

### 4.3 Boarding Pass — 6개

| API | 인증 | 핵심 요청/식별자 | 핵심 `result` | 소비 화면 |
| --- | --- | --- | --- | --- |
| `GET /surveys/questions` | 필요 | 없음 | 동적 6문항·선택지 | 설문 |
| `POST /boarding-passes` | 필요 | `dataConsent`, `answers[]` | 발급 pass·스냅샷 상품 | 발급 완료 |
| `GET /boarding-passes/latest` | 필요 | 없음 | 최근 pass 또는 404 | 기존 pass 진입 |
| `POST /boarding-passes/{boardingPassId}/scan` | 필요 | 선택 `storeId` | 방문·입장번호·적립 credit | 스캔 |
| `GET /boarding-passes/{boardingPassId}/route` | 필요 | pass ID | 5개 층 추천 순서·사유 | Flight, Guide |
| `POST /boarding-passes/{boardingPassId}/complete` | 필요 | pass ID | 체류시간·스탬프·방문 수 | 비행 종료 |

### 4.4 Travel Guide — 2개

| API | 인증 | 핵심 요청/식별자 | 핵심 `result` | 소비 화면 |
| --- | --- | --- | --- | --- |
| `GET /floors` | 필요 | 없음 | 매장명·층 목록 | Guide 인덱스 |
| `GET /floors/{floorId}` | 필요 | 숫자 `floorId` | 콘텐츠 블록·audio URL | 층 상세·도슨트 |

### 4.5 Passport — 4개

| API | 인증 | 핵심 요청/식별자 | 핵심 `result` | 소비 화면 |
| --- | --- | --- | --- | --- |
| `GET /passport` | 필요 | 없음 | 여권번호·신분면·`birthDate`(추가 예정)·credit·방문 수 | Passport |
| `GET /passport/stamps` | 필요 | 없음 | 최신순 스탬프·방문 ID | Passport 스탬프 |
| `GET /passport/visits/{visitLogId}` | 필요 | 숫자 방문 ID | 티켓·체류·`floorId`/`tagline` 관람 층 | 방문 상세 시트 |
| `GET /passport/credits` | 필요 | 없음 | 잔액·원장 | credit 내역 |

### 4.6 이미지 업로드·AI 피팅 — 5개

| API | 인증 | 핵심 요청/식별자 | 핵심 `result` | 소비 화면 |
| --- | --- | --- | --- | --- |
| `POST /fitting-sessions/upload-url` | 필요 | `fileName`, JPEG/PNG `contentType` | SAS `uploadUrl`, `fileKey`, `expiresIn` | 피팅 업로드 |
| `PUT {uploadUrl}` | SAS만 사용 | 응답의 전체 URL에 raw `File`, `x-ms-blob-type: BlockBlob` | 빈 body, HTTP 200/201 | Azure 직접 업로드 |
| `PUT /users/me/body-image` | 필요 | 서버가 준 `fileKey` | 읽기용 `bodyImageUrl` | 기본 이미지 등록 |
| `POST /fitting-sessions` | 필요 | `productColorId`, 선택 `fileKey` | `PENDING` 세션·비용·상품 스냅샷 | 피팅 시작 |
| `GET /fitting-sessions/{fittingSessionId}` | 필요 | 숫자 세션 ID | 상태·결과 URL·상품 스냅샷 | 피팅 polling·결과 |

### 4.7 Swagger 대조 결과

| 비교 | 결과 | 판단 |
| --- | --- | --- |
| Swagger에만 있는 method/path | 0개 | 로컬 인벤토리의 백엔드 API 누락 없음 |
| 로컬에만 있는 백엔드 method/path | 0개 | 제거할 백엔드 API 없음 |
| Swagger 밖의 통합 호출 | Azure `PUT {uploadUrl}` 1개 | 외부 SAS 호출이므로 정상 |
| Swagger에만 드러난 입력 | `GET /products`의 선택 `sort:string`, `size:string` | 허용값·의미 확정 전 UI 필터에는 연결하지 않음 |
| Swagger에만 드러난 응답 | 방문 이력 `floorId`, `tagline`; route `subtitle`; fitting 상품 5개 필드 | mapper와 테스트에 반영 |

피팅 상품 스냅샷 5개 필드는 `productColorId`, `productId`, `name`, `price`, `thumbnailImageUrl`이다. polling과 수동 재조회 결과 화면은 이 값을 사용하므로 정적 상품 데이터로 되돌아가지 않는다. `productSizeId`는 없으므로 쇼핑백 CTA는 상품 상세로 이동해 사이즈를 선택하게 한다.

Swagger가 현재 확정한 enum은 다음과 같다.

| 필드 | 값 |
| --- | --- |
| `UserMeResponse.provider` | `LOCAL`, `KAKAO` |
| 설문 `questionType` | `SINGLE_SELECT`, `TEXT` |
| Boarding Pass `status` | `ISSUED`, `SCANNED`, `COMPLETED` |
| Boarding Pass item `source` | `WISHLIST`, `BAG`, `SURVEY` |
| 층 `blockType` | `TEXT`, `IMAGE`, `PRODUCT`, `QUOTE`, `LIST` |
| fitting `status` | `PENDING`, `DONE`, `FAILED` |
| credit `reason` | `SIGNUP`, `SCAN`, `FITTING`, `REFUND` |

## 5. 계약 차단사항과 확정 기준

### 5.1 구현 전에 백엔드와 반드시 확인할 항목

| 우선순위 | 항목 | 문서 문제 | 확정 전 프런트 기준 |
| --- | --- | --- | --- |
| 차단 | 노출된 테스트 JWT | 문서에 Bearer 토큰 평문 존재 | 토큰을 폐기·재발급하고 저장소 문서에서 제거. 계획서에는 값을 기록하지 않음 |
| P0 명세 | 공개 인증 API의 Swagger 보안 | 루트 JWT가 31개 전체에 상속되어 login/signup/kakao도 잠금 표시됨 | 세 API는 Bearer 없이 호출하고 백엔드는 operation-level `security: []`를 추가. `/auth/profile`은 보호 유지 |
| P0 명세 | Swagger 오류·media type | 31개 모두 200과 `*/*`만 선언하고 로컬의 400/401/404/409를 누락 | 프런트는 로컬 오류 계약과 실제 status를 보존. 백엔드는 공통 오류 envelope와 `application/json`을 Swagger에 보강 |
| 차단 | 인증 수명주기 | 만료시간·refresh·logout 계약 없음 | access token만 `sessionStorage`에 보관, 401 시 제거·재로그인. 자동 refresh 없음 |
| 차단 | 프로필 완료 판별 | 가입 직후 이탈한 사용자를 `/users/me`로 식별할 완료 flag·nullable 규칙 없음 | 세 필드가 모두 유효하면 완료로 보되, null 가능 여부와 명시적 `profileCompleted` 제공 여부를 백엔드에 확인 |
| 차단 | 카카오 OAuth 설정 | authorize URL·client ID·등록 callback 없음 | 공개 client ID와 redirect URI를 별도 환경변수로 받고 secret은 브라우저에 두지 않음 |
| 차단 | 업로드 `fileKey` | 발급 예시는 `user-uploads/`, 등록은 `fitting/` 강제 | 서버가 반환한 `fileKey`를 변형 없이 전달하고 prefix를 조립하지 않음. 두 API의 계약이 일치하기 전에는 기본 바디 이미지 등록 완료로 판정하지 않음 |
| 차단 | 업로드 TTL | 300초·5분·600초가 혼재 | 숫자 `expiresIn` 응답만 신뢰. Azure 403이면 URL을 다시 발급해 1회 재시도 |
| 차단 | Azure CORS | 앱 origin·허용 헤더 계약 없음 | `PUT`, 실제 origin, `Content-Type`, `x-ms-blob-type` 허용을 Preview/Production에서 검증 |
| 차단 | 상품 목록 중복 의미 | 같은 `productId`가 색상별로 반복 | `productId`로 묶고 `isDefault` 색상을 카드 대표로 사용. 표시 색상의 `productColorId`로 위시 처리 |
| 차단 | Boarding Pass 티켓 필드 | API에 class/flight/from/to/gate/time 없음 | 승객·코드·발급일만 서버 데이터로 사용하고 나머지는 디자인 상수임을 mapper에 명시 |
| 단계 5 출시 차단 | Passport `birthDate` | 추가 예정으로 확인됐지만 현재 `PassportResponse`에는 없음 | 전환 중에는 이미 복원된 `/users/me.birthDate`만 fallback으로 사용하고 추가 조회하지 않음. Swagger·실응답 검증 후 fallback과 legacy fixture/test를 제거해야 단계 5 완료 |
| 차단 | 피팅 처리 중 계약 | GET의 `PENDING` 예시·최대 처리시간 없음 | 2초 간격, 최대 60회(120초), 이탈 시 Abort, timeout 시 같은 세션 수동 재조회 제공 |

### 5.2 문서 오류지만 전체 작업을 막지 않는 항목

- 로그인 표의 400과 본문 401 불일치: 실제 응답 status와 code를 모두 보존해 처리한다.
- 위시 삭제의 404 제목과 `COMMON401` body 충돌: 401은 재로그인, 404는 이미 삭제된 상태로 처리한다.
- `PRODUCT_COLOR**_**NOT_FOUND`: 실제 분기값은 `PRODUCT_COLOR_NOT_FOUND`로 확인되기 전까지 message 기반 공통 오류를 사용한다.
- 쇼핑백 재고 부족 code 누락: 4xx message를 그대로 사용자에게 표시하고 특정 문자열 분기는 하지 않는다.
- Boarding Pass scan body: Swagger는 request body와 `storeId`를 선택으로 표시하지만 기본값을 주지 않는다. `storeId`가 없으면 body를 생략하고 실서버가 이를 허용하는지 확인한다.
- `GET /products`의 `sort`·`size`: Swagger에 선택 string query로만 있고 의미·허용값·기본값이 없다. API 함수는 전달 기능을 지원하되 UI 필터는 계약 확정 전 노출하지 않는다.
- 방문 상세: Swagger의 `TravelHistoryResponse`에 `floorId`와 `tagline`이 있으므로 로컬 JSON 예시가 오래된 것으로 본다. `floorNo` 조인 없이 `floorId`로 상세를 연다.
- 층 콘텐츠: Swagger에 5개 `blockType`과 `FloorProductResponse(productId, name, price, imageUrl)`가 있다. 다만 block별 필수/nullable 규칙이 없으므로 enum별 mapper와 대체 UI를 둔다.
- nullable 충돌: `sizeNote`, `resultImageUrl`, `audioUrl`, 콘텐츠의 `body/imageUrl/product`, route의 `reason`은 Swagger상 non-null string/object처럼 보이지만 로컬 예시에 null이 있다. mapper는 null을 허용하고 Swagger 보강을 요청한다.
- 응답 required 누락: 모든 Swagger response DTO에 `required` 배열이 없다. 자동 생성 타입 대신 필수 화면 필드를 mapper 경계에서 검사한다.
- 추천 동선 404: 자동 polling으로 단정하지 않고 준비 중 상태와 수동 재시도를 제공한다.
- offset 없는 timestamp: 해커톤 단일 매장 로컬 시간으로 표시하고 임의 UTC 변환을 하지 않는다.
- create API의 200 사용: 문서 계약을 그대로 따른다. 201/202를 프런트가 요구하지 않는다.

## 6. 목표 구조와 파일 책임

새 계층이나 의존성을 만들지 않고 현재 `src/shared/api` 패턴을 확장한다.

| 파일 | 책임 |
| --- | --- |
| `src/shared/api/endpoints.js` | 백엔드 31개 operation의 endpoint를 보유(27개 unique path). 동적 ID 경로 생성. Azure SAS URL은 등록하지 않고 응답 문자열을 그대로 사용 |
| `src/shared/api/client.js` | base fetch, endpoint별 Bearer 선택, JSON envelope 해제, 비정형·빈 응답, `ApiError`, AbortSignal |
| `src/shared/api/authToken.js` | 메모리 + `sessionStorage` access token, 개발 토큰 제한, clear |
| `src/shared/api/authApi.js` | 일반·카카오 인증, 프로필 생성/조회/수정 |
| `src/shared/api/productApi.js` | 선택 `sort`/`size` query가 있는 목록·상세 요청과 현재 상품 화면 모델 변환 |
| `src/shared/api/wishlistApi.js` | 조회·추가·삭제와 위시 화면 모델 변환 |
| `src/shared/api/shoppingBagApi.js` | 기존 `cartApi.js`를 계약 이름에 맞춰 교체, 조회·추가·삭제 |
| `src/shared/api/boardingPassApi.js` | 설문·발급·latest·scan·route·complete와 티켓 화면 모델 |
| `src/shared/api/floorApi.js` | 층 목록·상세와 콘텐츠 block 정규화 |
| `src/shared/api/passportApi.js` | 예정된 `/passport.birthDate` 우선 매핑과 한시적 session fallback, 스탬프·방문의 `floorId`/`tagline`·credit 변환 |
| `src/shared/api/fittingApi.js` | 업로드 URL, Azure raw PUT, 바디 이미지 등록·삭제, fitting 생성·조회와 상품 스냅샷 변환 |
| `src/app/providers.jsx`·`src/entities/session/useSession.js` | 앱 시작 시 `/users/me` 복원, 로그인 반영, 로그아웃/401 상태 공유. 기존 가짜 `/session` 의존 제거 |
| `src/app/router.jsx` | 공개·보호 route 분리와 카카오 callback route 등록 |
| `.env.example` | API base, app origin, MSW, Kakao 공개 client ID·redirect URI 키만 안내 |
| `src/mocks/handlers/*.js` | 실제 method/path/envelope/error와 같은 stateful mock |
| 각 페이지 파일 | loading/empty/error/success와 사용자 이벤트. DTO 해석은 하지 않음 |

mapper는 우선 해당 API 파일에 둔다. 한 파일이 실제로 커질 때만 분리하며, 처음부터 `mappers/`, repository, service 추상화를 만들지 않는다.

여기서 API 경로와 브라우저 route는 구분한다. 백엔드의 `/cart`와 `/boarding-pass/scan` 호출은 제거하지만, 사용자가 보는 `/cart`와 `/boarding-pass/scan` 화면 URL은 현재 내비게이션 호환을 위해 유지한다.

## 7. 공통 데이터·오류 흐름

### 7.1 일반 백엔드 요청

```text
페이지 이벤트
  → 도메인 API 함수
  → apiFetch
  → Authorization/JSON 처리
  → HTTP 응답 파싱
  → 실패: ApiError(status, code, message)
  → 성공: result 해제
  → 도메인 mapper
  → 화면 모델
  → 페이지 state 갱신
```

`apiFetch`는 다음 원칙을 갖는다.

- `Content-Type`이 부정확하거나 `*/*`여도 non-empty body는 text로 읽은 뒤 JSON parse를 시도한다.
- 2xx 성공 envelope는 `isSuccess === true`이고 `result` key가 있어야 한다. 아니면 계약 오류를 던지며, 명시적인 `result: null` 허용 여부는 도메인 함수가 결정한다.
- 검증된 성공 envelope의 `result`만 반환한다.
- 오류 JSON의 `code`, `message`와 HTTP status를 모두 보존하고, body가 비었거나 JSON이 아니면 status 기반 `ApiError`를 만든다.
- login/signup/kakao만 `auth: false`를 명시하고 나머지 BoardingPass 백엔드 호출은 Bearer를 기본 적용한다. 잘못된 Swagger 전역 JWT 표기를 클라이언트 동작에 그대로 복제하지 않는다.
- 401이면 토큰을 지우되 라우팅은 페이지가 결정한다.
- 공통 클라이언트는 모든 실패를 던진다. `getLatestBoardingPass`만 `BOARDING_PASS_NOT_FOUND`를 잡아 `null`로 바꾼다.
- DELETE의 JSON 성공 body와 빈 body를 모두 안전하게 처리한다.
- 요청 취소용 `signal`을 전달한다.
- 도메인 mapper는 화면에 필수인 필드를 검사하고, Swagger의 `required` 누락 때문에 생긴 `undefined`를 조용히 표시하지 않는다.

### 7.2 Azure 직접 업로드

```text
JPEG/PNG 선택
  → 백엔드 upload-url 발급(Bearer + JSON)
  → SAS URL·fileKey를 메모리에만 보관
  → Azure PUT(raw File, JWT 없음, BlockBlob)
  → 성공 후 필요 시 body-image 등록 또는 fitting 요청
```

SAS URL은 로그, analytics, local/session storage에 남기지 않는다. `apiFetch`를 재사용하지 않고 전용 함수에서 native `fetch`를 호출한다.

### 7.3 인증 저장

- access token은 `sessionStorage`와 모듈 메모리에 보관한다.
- token 저장소는 변경 구독을 제공하고 App provider가 이를 구독한다. 따라서 `apiFetch`가 401에서 token을 지우면 인증 UI도 즉시 미인증 상태로 바뀐다.
- Production에서 `VITE_BEARER_TOKEN`을 읽지 않는다.
- refresh token이 없으므로 만료 401은 로그인 화면으로 복귀 가능한 오류 상태로 처리한다.
- 앱 시작 시 토큰이 있으면 `/users/me`를 호출해 인증과 프로필 완료 상태를 복원하고, 보호 화면은 복원이 끝날 때까지 렌더링하지 않는다.
- shared API 계층은 React Router를 import하지 않는다.

### 7.4 공개·보호 화면 경계

- 공개: 홈, 일반 로그인, 일반 회원가입, 카카오 callback, 정적 Boarding Pass 소개.
- 보호: 상품 목록·상세·피팅, 위시리스트, 쇼핑백, Boarding Pass 발급 이후 전체, Guide, Passport.
- 보호 route는 세션 상태가 `loading`일 때 공통 로딩 UI, 미인증일 때 `/login` 이동과 원래 목적지 보존, 인증일 때만 자식 화면을 렌더링한다.
- 서버 데이터는 현재 페이지 state만 보관한다. 별도 전역 캐시를 만들지 않으며 화면 재진입 시 다시 조회한다.

### 7.5 오류 표시 기준

| 오류 | 공통 처리 | 화면 처리 |
| --- | --- | --- |
| 401 | token 제거, 인증 상태 갱신 | 로그인으로 이동하고 원래 목적지 보존 |
| 400·409 | `ApiError`에 code/message 보존 | 검증·중복·상태 전이 message를 해당 폼이나 버튼 근처에 표시 |
| 의미 있는 404 | code별 분기 | latest 없음은 빈 상태, 실제 리소스 없음은 안내 후 이전 화면 이동 |
| 기타 4xx | status/code/message 보존 | 안전한 공통 안내를 표시하고 요청 전 상태 유지 |
| 5xx·네트워크 | 일반 사용자 문구로 정규화 | 읽기 요청만 수동 재시도 제공 |
| Abort | 오류 UI를 만들지 않음 | 화면 이탈·새 요청으로 취소된 결과 무시 |

## 8. 기능별 사용자 흐름

### 8.1 일반 회원가입과 로그인

```text
일반 가입: email/password → /auth/signup → token 저장
  → name/birthDate/nationality → /auth/profile → 앱

일반 로그인: email/password → /auth/login → token 저장 → /users/me → 앱

카카오: authorize → callback(code) → /auth/kakao
  → isNewUser=true: 추가정보
  → false: 앱
```

현재 회원가입 화면은 추가정보만 있으므로 이메일·비밀번호 단계를 같은 route 안의 첫 단계로 추가한다. 별도 폼 라이브러리는 사용하지 않는다.

### 8.2 상품·위시리스트·쇼핑백

```text
/products → 대표 색상 카드
  → /products/{productId}
  → 색상 선택(productColorId)
  ├─ 위시 POST/DELETE
  └─ 사이즈 선택(productSizeId) → shopping-bag POST

/wishlist → productColorId로 삭제
/shopping-bag → shoppingBagItemId로 삭제
```

mutation 버튼은 요청 중 중복 클릭을 막는다. 낙관적 갱신은 하지 않고 성공 응답을 받은 뒤 확인된 항목만 갱신하며, 응답만으로 목록을 확정할 수 없을 때만 재조회한다. 실패 시 기존 화면 상태를 유지한다.

상품 목록은 기본적으로 query 없이 호출한다. `sort`와 `size`는 URL encoding과 생략 동작까지만 API 계층에서 지원하고, 백엔드가 의미·허용값을 문서화하기 전에는 화면 필터로 노출하지 않는다.

### 8.3 Boarding Pass와 매장 여정

```text
/surveys/questions → isRequired/questionType 기반 동적 설문
  → /boarding-passes(dataConsent, answers)
  → 발급 완료·latest 조회
  → /scan
  → /route + /floors
  → /floors/{floorId}
  → /complete
  → Passport/stamps/visit detail
```

설문 문항 번호와 개수를 하드코딩하지 않는다. `questionType`에 따라 입력을 만들고, `isRequired`가 `false`인 문항만 건너뛰게 한다. TEXT 응답은 200자로 제한한다. 발급·스캔·종료 POST는 자동 재시도하지 않고 버튼 중복 제출을 막는다.

route의 `subtitle?: string | null`을 화면 모델에 보존하고 값이 있을 때만 표시한다. `reason`도 `isRecommended && reason`일 때만 표시한다. 방문 이력의 `tagline`은 optional로 보존하고, 층을 열 때는 `travelHistory[].floorId`를 직접 사용한다. `floorId`가 없으면 `floorNo`로 추론하지 않고 해당 이동을 비활성화하면서 계약 오류를 기록한다.

층 콘텐츠는 `TEXT/QUOTE/LIST → body`, `IMAGE → imageUrl`, `PRODUCT → product`를 핵심 payload로 사용한다. 연속된 LIST block은 하나의 목록으로 묶는다. 핵심 payload가 없는 block만 대체 UI와 개발 경고로 처리하고 나머지 층 콘텐츠는 유지한다.

Passport 생년월일은 배포 전환기에만 이미 로드된 session 값을 fallback으로 쓰고, `/passport.birthDate`가 오면 항상 그 값을 우선한다. Swagger `format: date`와 실서버 smoke를 확인한 뒤 fallback과 legacy MSW fixture/test를 제거해야 단계 5가 완료된다.

### 8.4 AI 피팅

```text
상품 색상 선택
  → 새 이미지: upload-url → Azure PUT → fileKey
  → 또는 기본 바디 이미지 사용(fileKey 생략)
  → fitting POST(PENDING)
  → 2초 polling
  → DONE: resultImageUrl 표시
  → FAILED: 실패 안내 + credit 재조회
```

가짜 퍼센트는 실제 서버 progress가 없으므로 제거한다. UI 진행 바는 `PENDING` 동안 indeterminate 의미로 사용하고 완료 시 100%로 전환한다.

피팅 POST와 GET은 Swagger에서 같은 응답 schema를 사용한다. 결과의 상품 스냅샷 5개 필드로 상품 정보와 상세 이동을 복원하고, 정적 `products.js`를 결과 fallback으로 사용하지 않는다. 쇼핑백 담기는 스냅샷에 `productSizeId`가 없으므로 `productId`로 상품 상세에 이동한 뒤 사이즈 선택을 거친다.

## 9. 우선순위와 단계 경계

| 단계 | 우선순위 | 산출물 | 독립 완료 조건 |
| --- | --- | --- | --- |
| 0. 계약·보안 정리 | P0 | Swagger 공개 auth·오류/nullable 보강 요청, 차단 답변, 토큰 폐기, CORS 확인표 | 실서버 호출에 필요한 값과 예외가 문서화됨 |
| 1. 공통 API 기반 | P0 | client/token/endpoints와 정확한 MSW envelope | endpoint·client 단위 테스트 통과 |
| 2. 일반 인증·프로필 | P0 | 로그인·가입 2단계·세션 복원 | 새 계정 생성부터 보호 API 진입까지 통과 |
| 3. 상품·위시·쇼핑백 | P0 | 숫자 ID 기반 목록/상세/mutation, 선택 query 직렬화 | 탐색 → 위시/쇼핑백 → 새로고침 유지 통과 |
| 4. Boarding Pass 핵심 | P0 | 동적 설문·발급·latest·scan | 발급과 스캔 흐름 통과 |
| 5. Guide·종료·Passport | P1 | route/floors/complete/passport 전체, `birthDate` 전환 | Swagger·실응답 birthDate, fallback 제거, 방문 `floorId` 직접 이동 통과 |
| 6. 카카오·AI 피팅 | P2 | OAuth callback, SAS upload, polling, 상품 스냅샷, credit | 카카오 진입과 피팅 성공/실패·재조회 흐름 통과 |
| 7. 실서버·배포 검증 | P0 출시 게이트 | MSW off 전체 smoke, Vercel/CORS 검증 | Preview와 Production 핵심 흐름 통과 |

각 단계는 앞 단계의 공개 인터페이스만 사용하며, API 기반과 페이지를 여러 단계에 걸쳐 반쯤 남겨두지 않는다. 단계 2부터는 각 수직 흐름을 끝낼 때마다 가능한 범위의 MSW off smoke를 수행하고, 단계 7에서 전체 흐름을 다시 검증한다.

## 10. 테스트 설계

### 10.1 API 계층

- base URL trailing slash와 명세 경로 결합
- login/signup/kakao는 Authorization을 생략하고 나머지 백엔드 요청은 Bearer를 포함하는지
- `*/*`·부정확한 Content-Type의 non-empty JSON body parse
- 정상 성공 envelope `result` 해제와 2xx malformed envelope 계약 오류
- JSON·비 JSON·빈 body 4xx/5xx에서 `ApiError`의 status/code/message 보존
- 401 token clear
- `/products`의 `sort`/`size` URL encoding과 미전달 시 query 생략
- scan의 `storeId` 제공/미제공 body와 실서버 기본 동작
- `getLatestBoardingPass`가 `BOARDING_PASS_NOT_FOUND`만 `null`로 바꾸고 다른 404는 보존하는지
- 200/201 빈 body 처리
- Azure PUT에 Authorization이 없고 raw File과 필수 헤더만 전달되는지
- 전환 중 Passport가 직접 `birthDate`를 우선하고 session fallback은 추가 호출 없이 동작하는지, 단계 5 완료 시 fallback 테스트가 제거됐는지
- 방문 `floorId`/`tagline`, 누락 `floorId` 이동 차단, optional route `subtitle`/`reason`
- 콘텐츠 5개 enum, 연속 LIST grouping, 타입별 핵심 payload 누락을 block 단위로 격리하는지
- nullable `sizeNote`/`resultImageUrl`/`audioUrl`과 fitting snapshot 필수 표시 필드 누락 경계
- fitting polling의 DONE/FAILED/timeout/Abort와 상품 상세 경유 쇼핑백 흐름

### 10.2 화면

- 로그인 실패, 가입 중복, 신규 프로필 완료
- 상품 loading/error/empty와 숫자 ID 상세 진입
- 색상 단위 위시, 사이즈 단위 쇼핑백, 삭제 실패 시 기존 상태 유지
- `SINGLE_SELECT`/`TEXT`, 필수/선택 설문과 `dataConsent`
- latest 404, scan 중복, complete 선행조건 오류
- route 404 재시도, subtitle/reason 조건, 콘텐츠 5개 block·연속 LIST 렌더와 nullable audio
- Passport 없음·`birthDate`·빈 스탬프·`floorId`/`tagline` 방문 상세·credit 부호 표시
- 업로드 MIME 실패, SAS 만료 재발급, fitting DONE/FAILED/timeout·상품 복원·상세 경유 쇼핑백

### 10.3 검증 명령과 환경

- 기능별 단위 실행: `npm.cmd run test:run -- <test-file>`
- 단계 완료: `npm.cmd run verify`
- 개발 계약 검증: `VITE_ENABLE_MSW=true`
- 실서버 smoke: `VITE_ENABLE_MSW=false`
- 계약 smoke: 라이브 OpenAPI 31개 method/path와 endpoint inventory의 차이가 0인지 확인
- Vercel Preview에서 일반 로그인, 상품 mutation, Boarding Pass 발급·스캔, Passport, 피팅을 실제 모바일 viewport로 확인

## 11. 보안·운영 원칙

- `.env` 실제 값과 SAS URL을 문서·로그·테스트 snapshot에 남기지 않는다.
- `VITE_` 변수에는 API base URL, 앱 origin, Kakao 공개 client ID/redirect URI만 둔다. secret과 운영 Bearer token은 두지 않는다.
- 노출된 테스트 JWT는 유효 여부와 무관하게 폐기 대상으로 본다.
- 이미지 MIME은 JPEG/PNG만 허용하고 서버가 파일 크기 한도를 확정하면 input 단계에서도 같은 값으로 검증한다.
- mutation은 버튼 잠금으로 중복 제출을 막지만, 네트워크 결과가 불명확한 POST의 안전한 자동 재시도는 하지 않는다.
- 예상하지 못한 enum·content block을 조용히 오표시하지 않는다. 공통 오류 UI와 개발 경고로 계약 변경을 드러낸다.
- MSW는 개발 전용이며 Production에서는 항상 비활성화한다.

## 12. 완료 기준

### 12.1 프런트 구현 완료

- 라이브 Swagger 31개 백엔드 operation과 API 함수가 1:1이고 method/path 차이가 0이며, Azure 직접 PUT 1개가 별도 함수로 추적된다.
- 통합 제외 문서 3개가 런타임 코드나 의존성에 반영되지 않는다.
- `/session`, `/cart`, `/boarding-pass/scan` 잘못된 **백엔드 API 호출**이 제거된다. 같은 문자열의 브라우저 route는 유지한다.
- 페이지가 백엔드 envelope나 원시 DTO 구조를 직접 해석하지 않는다.
- MSW가 Swagger의 method/path/success envelope와 단계 0에서 승인한 오류 계약을 사용한다.
- login/signup/kakao 무Bearer와 보호 API Bearer가 단위·실서버 smoke에서 검증된다.
- 방문 상세는 `floorNo` 추론 없이 `travelHistory[].floorId`로 층 상세를 열고 `tagline`을 보존한다.
- 상품·위시·쇼핑백·설문·Boarding Pass·Guide·Passport·피팅의 loading/empty/error/success 상태가 존재한다.
- 노출 토큰, 운영 `VITE_BEARER_TOKEN`, 저장된 SAS URL이 없다.
- MSW on 전체 테스트와 MSW off 실서버 smoke가 모두 통과한다.
- `npm.cmd run verify`가 exit code 0으로 완료된다.

### 12.2 외부 출시 게이트

백엔드 코드·Swagger 수정은 프런트 작업 범위 밖이지만 다음 조건이 충족되거나 담당자 승인 예외로 기록되기 전에는 전체 통합 출시 완료로 보지 않는다.

- Swagger에서 login/signup/kakao가 `security: []`로 공개 표시된다.
- 공통 오류 envelope와 실제 400/401/404/409가 Swagger에 반영되거나, 별도 승인된 오류 계약표가 있다.
- `PassportResponse.birthDate`가 `string(date)`로 Swagger와 실응답에 반영되고, 프런트의 session fallback과 legacy fixture/test가 제거된다.
- Azure CORS, `fileKey` prefix, 실제 `expiresIn` 계약이 Preview와 Production에서 확인된다.

## 13. 이 설계 검토 시 확인할 결정

상세 실행 체크리스트를 작성하기 전 다음 설계 결정만 검토한다.

1. 새 의존성 없이 기존 React state/effect를 유지한다.
2. access token은 `sessionStorage`에 보관하고 refresh는 구현하지 않는다.
3. 상품 목록은 `productId`로 묶고 기본 색상을 대표 카드로 사용한다.
4. 티켓의 API 미제공 필드는 디자인 상수로 명시한다.
5. fitting polling timeout은 120초로 둔다.
6. Passport `birthDate`는 `/passport` 값을 최종 기준으로 한다. 개발 전환기에만 기존 session 값을 fallback으로 쓰고 단계 5 완료 전에 제거한다.
7. 라이브 Swagger 구조와 로컬 Markdown의 business/error 설명을 함께 사용한다.
8. 전체 계획은 이 파일 하나에서 유지한다.
