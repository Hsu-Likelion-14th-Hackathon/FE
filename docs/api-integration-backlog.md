# 프론트엔드 백로그 — API 연동

> 2026-08-16 기준. 브랜치 `feat/api-client-foundation`, 실서버 `https://boardingpass.p-e.kr` 대상.

## 완료

| 도메인 | 비고 |
| --- | --- |
| 일반/카카오 로그인 · 회원가입 | 인가 코드 흐름 포함 |
| 상품 목록 · 상세 | 목록은 색 단위 → 대표색 1줄만 표시 |
| 위시리스트 | 담기/빼기 열쇠는 `productColorId` |
| 쇼핑백 | 담기 `productSizeId`, 삭제 `shoppingBagItemId` |
| AI 피팅 | 업로드 → 세션 → 2초 폴링. 브라우저 업로드만 CORS 블로커 |
| 크레딧 잔액 표시 | 피팅 화면 `Credit \| N` — `GET /passport` |
| 여권 (패스포트) | 신분면 · 방문 스탬프 · 방문 상세 · 회원정보 수정(`PATCH /users/me`) |

### 여권 연동 메모

- 신분 정보 수정은 토큰이 있으면 `PATCH /users/me`로 저장하고, 실패하면 시트를 열어 둔 채 사유를 보여 준다. 토큰이 없으면(여권은 로그인 없이 열람 가능) 지면 표기만 바꾼다. 실서버 저장 반영 확인 완료.
- 생년월일은 `GET /passport` 응답(PassportResponse)에 없어 `GET /users/me`에서 합쳐 온다.
- 방문 스탬프는 받은 그대로 보여 준다 — 0회면 0개. 채움 데이터는 조회가 실패했을 때(비로그인)만 쓴다.
- 여행 기록 면(마지막 면)은 넘겨서 못 가고 **스탬프를 눌러야** 그 방문의 상세(`GET /passport/visits/{id}`)로 열린다. TRAVEL HISTORY·티켓 탑승자/패스코드도 그 방문 값이다.

## 백로그 (프론트 작업)

### 미연동 API — 라이브 Swagger 31개 오퍼레이션 전수 대조 (2026-08-16)

연동 완료 28개(+Azure PUT 1개), 미연동 3개.

| # | Method · Path | 상태 | 메모 |
| --- | --- | --- | --- |
| 1 | `GET /passport/credits` | ❌ 함수 없음 | 크레딧 내역(잔액+원장). 잔액은 `GET /passport`로 이미 표시 중 — 내역 UI가 생기면 연결 |
| 2 | `PUT /users/me/body-image` | ❌ 함수 없음 | 기본 전신 이미지 등록/수정. 업로드 URL 발급 → Azure PUT → fileKey 등록 흐름. 화면 미구현 |
| 3 | `DELETE /users/me/body-image` | ❌ 함수 없음 | 기본 전신 이미지 삭제. 화면 미구현 |

2026-08-16 추가 완료: 설문 조회(6문항·TEXT 문항·dataConsent), 보딩패스 발급/최근 조회/스캔, AI 추천 동선, 층 목록/상세(blockType 렌더), 비행 종료(→ 여권 스탬프 생성). 실서버로 발급 → 스캔 → 종료 → 스탬프 → 방문 상세까지 전 구간 검증.

### 다음 연동 (권장 순서)

- [ ] 바디 이미지 등록/삭제 화면 (2·3)
- [ ] 크레딧 내역 UI + 연결 (1)
- [ ] MSW 목 정리 — 연동 끝난 도메인의 핸들러/픽스처 제거 또는 계약 모양 유지

### 연동 후 재검증

- [x] 여권 방문 상세 실데이터 검증 — 비행 종료로 스탬프 생성 후 실방문(입장 번호·체류 시간·TRAVEL HISTORY 4층)으로 확인 완료 (2026-08-16)
- [ ] 브라우저 업로드 경로 재검증 — **Azure CORS 풀린 뒤** (블로커 1)
- [ ] 실제 인물 사진으로 피팅 DONE 경로 검증 — 지금까지 FAILED 경로만 실서버 확인

### 피팅 후속

- [ ] 결과 화면 "이미지 저장" 버튼 동작 구현 (현재 자리만 있음)
- [ ] 결과 화면 "쇼핑백 추가" — 현재는 /cart 이동만. 사이즈 선택이 필요해 UX 결정 필요

### 계약 확정 대기

- [ ] 재고 `stock: null` 의미 — 현재 "수량 미상"으로 해석(품절 처리 안 함). 실서버 18개 사이즈 중 6개가 null

※ 쇼핑백 수량 조절은 기획에 없다 — 백로그 대상 아님.
※ 회원정보 수정은 별도 화면이 아니라 여권 페이지 안에서 진행한다 — 연동 완료.

## 블로커 (백엔드/인프라 의존)

### 1. Azure 스토리지 CORS 규칙 없음 — 브라우저 업로드 불가 ⚠️

프리플라이트 403 `CorsPreflightFailure`. curl로는 201이므로 SAS는 정상, 스토리지 계정 CORS 설정만 없다. 해결 전까지 브라우저에서는 "파일 없이 기본 전신 이미지" 경로만 동작.

요청할 규칙: Origins `http://localhost:5173` + 배포 URL / Methods `PUT, OPTIONS` / Headers `content-type, x-ms-blob-type`

### 2. 상품 누끼 컷(투명 PNG) 없음

사진이 색당 1장, 전부 흰 배경 카탈로그 컷 JPEG(총 18장)라 어두운 피팅 카드 위에서 흰 박스가 보인다. multiply 블렌드는 제품 색을 왜곡해(Soft Pink → 갈색) 철회. 시안(배경 없이 제품만)을 살리려면 배경 제거 에셋 필요.

### 3. 문서·실서버 불일치

- 피팅 `creditCost`: 문서 50 ↔ 실서버 100
- `GET /passport` 응답에 `birthDate` 없음 — 프론트는 `/users/me` 병합으로 대응 완료. 백엔드가 추가해 주면 병합 호출 하나를 줄일 수 있다
- `docs/api` 명세가 중복본이 있고 일부 낡음 → **계약 기준은 라이브 Swagger(`/v3/api-docs`)로 통일**

## 참고 — AI 피팅 구현 방식 (질문 대응용)

**폴링 방식. 결과 조회 요청 하나를 열어두는 long-polling이 아니다.**

```
[사진 선택 시]  POST /fitting-sessions/upload-url → Azure Blob PUT → fileKey
[사진 미선택]   fileKey 생략 → 회원 기본 전신 이미지 사용
                     ↓
POST /fitting-sessions (productColorId, fileKey?)  ← 1회 호출
  → 즉시 PENDING + fittingSessionId, 크레딧 차감(실서버 100)
                     ↓
GET /fitting-sessions/{id}  ← 2초 간격 폴링 (setInterval, 매번 새 요청)
  DONE   → 폴링 중단, resultImageUrl로 결과 화면 전환
  FAILED → 폴링 중단, 업로드 화면 복귀 + 환급 안내(백엔드 자동 환급)
```

- 피팅 열쇠는 상품이 아니라 색(`productColorId`). 상세의 Fitting 링크가 보고 있는 색을 쿼리로 싣는다: `/products/1/try-on?color=2`
- 진행률 바는 장식 — 서버가 끝내기 전에는 95% 천장 아래에서만 차오르고, 100%는 서버 `DONE`만 채운다
- 조회 실패 1회로 폴링을 끊지 않고 다음 눈금에 재시도. 401만 즉시 중단
- 취소/화면 이탈 시 인터벌 해제 + 요청 abort
- 실패 사유는 백엔드 message 그대로 표시 (`INSUFFICIENT_CREDIT` 등)

실서버 검증: 업로드 URL→Azure PUT 201(curl), 세션 생성→폴링→FAILED→화면 복귀, 크레딧 원장 `FITTING -100 → REFUND +100`, 잔액 표시.
