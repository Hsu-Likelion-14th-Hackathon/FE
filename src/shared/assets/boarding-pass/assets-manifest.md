# 보딩패스 에셋 manifest

최종 갱신: 2026-08-09 (SA-COMPLETE)
규칙: 화면 에이전트는 이 표에 등재된 경로만 import 한다. 미등재 에셋이 필요하면 blocked로 보고. 기존 키 rename 금지, append만 허용.

피그마 fileKey: `nPoHrwxi0e0738SWNzN7rN` (기준 캔버스 390×844)
와프: `0:1` / 디자인: `1:2`

## 공통 (icons/)

| 키                  | 경로                                                     | 원본 nodeId | 타입 | 사용처                                                       |
| ------------------- | -------------------------------------------------------- | ----------- | ---- | ------------------------------------------------------------ |
| icon-menu           | src/shared/assets/boarding-pass/icons/menu.svg           | 472:4759    | svg  | 헤더 좌측 메뉴 (전 화면 공통)                                |
| icon-heart          | src/shared/assets/boarding-pass/icons/heart.svg          | 472:4768    | svg  | 헤더 위시리스트 (전 화면 공통)                               |
| icon-cart           | src/shared/assets/boarding-pass/icons/cart.svg           | 472:4770    | svg  | 헤더 장바구니 (전 화면 공통)                                 |
| logo-mcm-wordmark   | src/shared/assets/boarding-pass/icons/mcm-wordmark.svg   | 472:4772    | svg  | 헤더 중앙 MCM 워드마크 로고 (전 화면 공통)                   |
| icon-header-diamond | src/shared/assets/boarding-pass/icons/header-diamond.svg | 472:4782    | svg  | 타이틀 밴드 좌우 마름모 (#E2C5B0 @40%)                       |
| icon-header-dot     | src/shared/assets/boarding-pass/icons/header-dot.svg     | 472:4788    | svg  | 타이틀 밴드 좌우 장식 점 (#E2C5B0 @40%)                      |
| icon-back-arrow     | src/shared/assets/boarding-pass/icons/back-arrow.svg     | 508:5357    | svg  | (24)~(29) 설문 진행 바 좌측 뒤로가기 화살표 ((24) 기준 노드) |
| icon-notice-error   | src/shared/assets/boarding-pass/icons/notice-error.svg   | 1155:302    | svg  | (23-1) 빈 위시리스트·쇼핑백 토스트 좌측 엑스 아이콘          |

## intro/

| 키                | 경로                                                  | 원본 nodeId        | 타입 | 사용처                                          |
| ----------------- | ----------------------------------------------------- | ------------------ | ---- | ----------------------------------------------- |
| intro-pass-card   | src/shared/assets/boarding-pass/intro/pass-card.png   | 472:4800+4811+4812 | png  | (22) 인트로 패스 카드 정적 합성(보우·리본·카피) |
| intro-ticket-logo | src/shared/assets/boarding-pass/intro/ticket-logo.png | 472:4805           | png  | 티켓/완료 등에서 쓰는 MCM 로렐 엠블럼           |

## landing/

| 키                     | 경로                                                   | 원본 nodeId | 타입 | 사용처                                               |
| ---------------------- | ------------------------------------------------------ | ----------- | ---- | ---------------------------------------------------- |
| landing-plane          | src/shared/assets/boarding-pass/landing/plane.png      | 502:4974    | png  | (23) 랜딩 중앙 MCM 비행기 히어로 이미지              |
| landing-cta-plane      | src/shared/assets/boarding-pass/landing/cta-plane.svg  | 492:4963    | svg  | (23) 「비행 시작하기」 CTA 우측 비행기 아이콘        |
| landing-stage-back     | src/shared/assets/boarding-pass/landing/stage-back.png | 492:4942    | png  | (23) 랜딩 스테이지 배경 글로우                       |
| landing-stage-back-svg | src/shared/assets/boarding-pass/landing/stage-back.svg | 492:4942    | svg  | (23) 랜딩 스테이지 배경 글로우(Figma SVG · PNG 대체) |

## survey/

| 키             | 경로                                               | 원본 nodeId | 타입 | 사용처                                                                                            |
| -------------- | -------------------------------------------------- | ----------- | ---- | ------------------------------------------------------------------------------------------------- |
| survey-q-plane | src/shared/assets/boarding-pass/survey/q-plane.svg | 508:5360    | svg  | (24)~~(29) 질문 라벨(Q1~~Q3) 좌측 비행기 아이콘 ((24) 기준 노드, 각 설문 프레임에 동일 노드 반복) |

## complete/

| 키                      | 경로                                                     | 원본 nodeId       | 타입 | 사용처                                                                           |
| ----------------------- | -------------------------------------------------------- | ----------------- | ---- | -------------------------------------------------------------------------------- |
| complete-stage-back     | src/shared/assets/boarding-pass/complete/stage-back.svg  | 532:6148          | svg  | (33)(34) 완료 스테이지 스포트라이트 배경                                         |
| complete-stage-back-png | src/shared/assets/boarding-pass/complete/stage-back.png  | 3002:379          | png  | (33)(34) 완료 본문 단색 그라데이션+비세토스 배경. Figma `EcjMcxEJlMBy1c4A1aCKD8` |
| complete-ticket-card    | src/shared/assets/boarding-pass/complete/ticket-card.png | 532:6224+573:6226 | png  | (33)(34) 예전 정적 합성 보관용 — 런타임은 BoardingTicketCard                     |

## issue/

| 키                    | 경로                                                       | 원본 nodeId        | 타입 | 사용처                                                                  |
| --------------------- | ---------------------------------------------------------- | ------------------ | ---- | ----------------------------------------------------------------------- |
| issue-loading-spinner | src/shared/assets/boarding-pass/issue/loading-spinner.svg  | 611:7687           | svg  | (30)~(32) 발급 로딩 "Loading" 텍스트 옆 점 3개 스피너                   |
| issue-loading-tip     | src/shared/assets/boarding-pass/issue/loading-tip.svg      | I611:7688;776:4187 | svg  | (30)~(32) 발급 로딩 링 하단 흰색 tip                                    |
| issue-loading-symbol  | src/shared/assets/boarding-pass/issue/loading-symbol.svg   | 611:7688           | svg  | (30)~(32) 발급 로딩 심볼 레거시(미사용·conic CSS 대체)                  |
| issue-plane-route     | src/shared/assets/boarding-pass/issue/plane-route.svg      | 532:6210           | svg  | 티켓 ICN→MUC 사이 비행기+점선 항로 아이콘 ((33)(35)~(37)(42) 티켓 공통) |
| issue-barcode         | src/shared/assets/boarding-pass/issue/barcode.png          | 532:6218           | png  | (33) 완료 티켓 하단 바코드 ((35)~(37)(42) 재사용)                       |
| issue-qrcode          | src/shared/assets/boarding-pass/issue/qrcode.png           | 532:6219           | png  | (33) 완료 티켓 하단 QR 코드 ((35)~(37)(42) 재사용)                      |
| issue-ticket-stamp    | src/shared/assets/boarding-pass/issue/ticket-stamp.png     | 573:6226           | png  | (33) Figma 테라코타 MCM 스탬프 ((35)~(37)(42) 재사용)                   |
| issue-perforation     | src/shared/assets/boarding-pass/issue/perforation-line.svg | 532:6177           | svg  | 티켓 하단 절취선 (#777 dash 5 5 round)                                  |
| issue-ticket-body     | src/shared/assets/boarding-pass/issue/ticket-body.svg      | 532:6173           | svg  | 티켓 실루엣 마스크(노치 Union)                                          |

## scan/

| 키                | 경로                                                      | 원본 nodeId | 타입 | 사용처                                                                |
| ----------------- | --------------------------------------------------------- | ----------- | ---- | --------------------------------------------------------------------- |
| scan-stage-back   | src/shared/assets/boarding-pass/scan/stage-back.png       | 1369:685    | png  | (35)~(40) 스캔 페이지 배경. Figma `EcjMcxEJlMBy1c4A1aCKD8` 프레임 PNG |
| scan-point-scan   | src/shared/assets/boarding-pass/scan/point-scan.svg       | 576:6470    | svg  | (35) 스캔 대기 상태 중앙 point-scan 아이콘                            |
| scan-button-icon  | src/shared/assets/boarding-pass/scan/scan-button-icon.svg | 576:6454    | svg  | (35) "평가용 탑승권 스캔 시뮬레이션" 버튼 좌측 스캔 프레임 아이콘     |
| scan-check-circle | src/shared/assets/boarding-pass/scan/check-circle.svg     | 576:6699    | svg  | (36)(37) SUCCESS SCAN 체크 서클 아이콘                                |
| scan-credit-icon  | src/shared/assets/boarding-pass/scan/credit-icon.svg      | 583:6817    | svg  | (37) 크레딧 지급 토스트 좌측 체크 아이콘                              |

## flight/

| 키                        | 경로                                                          | 원본 nodeId | 타입 | 사용처                                                                              |
| ------------------------- | ------------------------------------------------------------- | ----------- | ---- | ----------------------------------------------------------------------------------- |
| flight-map                | src/shared/assets/boarding-pass/flight/map.png                | 635:8155    | png  | (41)(43) MAPS 태블릿 프레임 안 서울→뮌헨 지도 이미지 ((42) 재사용)                  |
| flight-cloud-large        | src/shared/assets/boarding-pass/flight/cloud-large.png        | 635:8116    | png  | (41)~(45) 공통 배경 기체 노즈 데코 (상단 202×151·하단 354×254 동일 이미지 2회 배치) |
| flight-plane-deco         | src/shared/assets/boarding-pass/flight/plane-deco.png         | 635:8118    | png  | (41)~(45) 공통 배경 좌하단 비행기 데코 (캔버스 좌측에서 클리핑되는 형태)            |
| flight-deco-right         | src/shared/assets/boarding-pass/flight/deco-right.png         | 671:8484    | png  | (41)(43) 우측 MCM 트렁크(보석함) 데코 이미지                                        |
| flight-route-path         | src/shared/assets/boarding-pass/flight/route-path.svg         | 635:8226    | svg  | (41)(43) 지도 하단 SEOUL→MUNICH 항로 체인 라인                                      |
| flight-plane-marker       | src/shared/assets/boarding-pass/flight/plane-marker.svg       | 635:8229    | svg  | (41)(43) 항로 위 현재 위치 비행기 마커                                              |
| flight-tablet-logo        | src/shared/assets/boarding-pass/flight/tablet-logo.png        | 635:8156    | png  | (41)(43) 모니터 하단 MCM 로고                                                       |
| flight-control-arrow      | src/shared/assets/boarding-pass/flight/control-arrow.svg      | 635:8172    | svg  | (41)(43) 모니터 컨트롤바 증감 화살표 (밝기·사운드 슬롯)                             |
| flight-camera-dot         | src/shared/assets/boarding-pass/flight/camera-dot.svg         | 635:8180    | svg  | (41)(43) 모니터 상단 카메라 점                                                      |
| flight-hinge              | src/shared/assets/boarding-pass/flight/hinge.svg              | 635:8147    | svg  | (41)(43) 모니터 하단 스탠드 마감                                                    |
| flight-hinge-screw        | src/shared/assets/boarding-pass/flight/hinge-screw.svg        | 635:8149    | svg  | (41)(43) 모니터 힌지 나사 (좌·우 미러)                                              |
| flight-control-brightness | src/shared/assets/boarding-pass/flight/control-brightness.svg | 635:8165    | svg  | (41)(43) 모니터 컨트롤바 밝기 아이콘                                                |
| flight-control-power      | src/shared/assets/boarding-pass/flight/control-power.svg      | 635:8163    | svg  | (41)(43) 모니터 컨트롤바 전원 아이콘                                                |
| flight-control-sound      | src/shared/assets/boarding-pass/flight/control-sound.svg      | 635:8161    | svg  | (41)(43) 모니터 컨트롤바 사운드 아이콘                                              |
| flight-docent-play        | src/shared/assets/boarding-pass/flight/docent-play.svg        | 635:8135    | svg  | (41)(43)(42) 음성 도슨트 재생 아이콘                                                |
| flight-docent-stop        | src/shared/assets/boarding-pass/flight/docent-stop.svg        | 635:8141    | svg  | (41)(43)(42) 음성 도슨트 정지 아이콘                                                |
| flight-nav-prev           | src/shared/assets/boarding-pass/flight/nav-prev.svg           | 635:8194    | svg  | (41)(43) 하단 재생바 이전 버튼                                                      |
| flight-nav-next           | src/shared/assets/boarding-pass/flight/nav-next.svg           | 635:8206    | svg  | (41)(43) 하단 재생바 다음 버튼                                                      |
| flight-ticket-sheet-back  | src/shared/assets/boarding-pass/flight/ticket-sheet-back.png  | 3002:368    | png  | (42) 티켓 바텀시트 단색+비세토스 배경. Figma `EcjMcxEJlMBy1c4A1aCKD8` 프레임 PNG    |

## stage/

| 키       | 경로                                         | 원본 nodeId | 타입 | 사용처                                                                 |
| -------- | -------------------------------------------- | ----------- | ---- | ---------------------------------------------------------------------- |
| stage-bg | src/shared/assets/boarding-pass/stage-bg.png | 1025:293    | png  | (43)~(47) 상단 바 아래 배경. Figma `GHEgor3gw7V9BMj2KLVZqf` 프레임 PNG |

## guide/

| 키                        | 경로                                                          | 원본 nodeId | 타입 | 사용처                                             |
| ------------------------- | ------------------------------------------------------------- | ----------- | ---- | -------------------------------------------------- |
| guide-deco-top            | src/shared/assets/boarding-pass/guide/deco-top.png            | 683:8781    | png  | (44) 가이드 개요 우상단 MCM 비행기 데코 이미지     |
| guide-overview-main       | src/shared/assets/boarding-pass/guide/overview-main.png       | 683:8782    | png  | (44) 가이드 개요 좌측 메인 MCM HAUS 건물 이미지    |
| guide-overview-figure     | src/shared/assets/boarding-pass/guide/overview-figure.png     | 683:8794    | png  | (44) 가이드 개요 우측 화살표 참(charm) 장식 이미지 |
| guide-nav-prev            | src/shared/assets/boarding-pass/guide/nav-prev.svg            | 702:9738    | svg  | (44)~(47) 하단 이전 원형 화살표                    |
| guide-nav-next            | src/shared/assets/boarding-pass/guide/nav-next.svg            | 702:9750    | svg  | (44)~(47) 하단 다음 원형 화살표                    |
| guide-product-trolley     | src/shared/assets/boarding-pass/guide/product-trolley.png     | 702:9780    | png  | (45) 1F Ottomar 비세토스 트롤리                    |
| guide-product-weekender   | src/shared/assets/boarding-pass/guide/product-weekender.png   | 702:9789    | png  | (45) 1F Ottomar 그라데이션 위켄더                  |
| guide-emblem-laurel       | src/shared/assets/boarding-pass/guide/emblem-laurel.png       | 722:10071   | png  | (46) 2F 로렐 엠블럼 글로우                         |
| guide-emblem-crest        | src/shared/assets/boarding-pass/guide/emblem-crest.png        | 722:10073   | png  | (46) 2F MCM 크레스트 로고                          |
| guide-product-tote-cognac | src/shared/assets/boarding-pass/guide/product-tote-cognac.png | 722:10064   | png  | (46) 2F 뮌헨 비세토스 토트 Cognac                  |
| guide-product-himmel      | src/shared/assets/boarding-pass/guide/product-himmel.png      | 736:10195   | png  | (47) 3F Himmel Shopper in MIRUM®                   |
| guide-product-econyl      | src/shared/assets/boarding-pass/guide/product-econyl.png      | 736:10202   | png  | (47) 3F Ottomar ECONYL® 위켄더 백팩                |

## passport/

| id                 | path                                                            | Figma node | type | use                        |
| ------------------ | --------------------------------------------------------------- | ---------- | ---- | -------------------------- |
| passport-cover     | src/shared/assets/boarding-pass/passport/passport-cover.png     | 52:18570   | png  | Isolated Visetos cover     |
| passport-spread    | src/shared/assets/boarding-pass/passport/passport-spread.png    | 52:18663   | png  | Isolated open passport     |
| passport-mcm-haus  | src/shared/assets/boarding-pass/passport/mcm-haus.png           | 52:18723   | png  | MCM HAUS storefront        |
| journey-decoration | src/shared/assets/boarding-pass/passport/journey-decoration.png | 52:19131   | png  | Isolated airplane ornament |

2026-08-12 검증: `passport-spread.png`는 최신 Figma 파일 `aklj7UjNcG6PDFJVRU9JXv`의 exact child `52:18665` raw source를 Figma 배치 크기 507×394로 저장했다. 스탬프 단계는 흰 배경 raster 대신 이 spread와 DOM 스탬프를 사용한다.

| id                  | path                                                             | Figma node | type | use                     |
| ------------------- | ---------------------------------------------------------------- | ---------- | ---- | ----------------------- |
| passport-emblem     | src/shared/assets/boarding-pass/passport/passport-emblem.png     | 52:18581   | png  | Cover emblem composite  |
| cover-mcm           | src/shared/assets/boarding-pass/passport/cover-mcm.png           | 52:18583   | png  | Cover MCM word          |
| cover-star          | src/shared/assets/boarding-pass/passport/cover-star.png          | 52:18585   | png  | Cover center star       |
| cover-passport      | src/shared/assets/boarding-pass/passport/cover-passport.png      | 52:18584   | png  | Cover PASSPORT word     |
| passport-bow-left   | src/shared/assets/boarding-pass/passport/passport-bow-left.png   | 52:18586   | png  | Cover left bow          |
| passport-bow-right  | src/shared/assets/boarding-pass/passport/passport-bow-right.png  | 52:18587   | png  | Cover right bow         |
| journey-ticket      | src/shared/assets/boarding-pass/passport/journey-ticket.png      | 52:19138   | png  | Journey ticket tile     |
| journey-ticket-mark | src/shared/assets/boarding-pass/passport/journey-ticket-mark.png | 52:19138   | png  | Journey ticket MCM mark |
| passport-stamp      | src/shared/assets/boarding-pass/passport/passport-stamp.png      | 52:18845   | png  | Transparent visit stamp |
| passport-stamp-bow  | src/shared/assets/boarding-pass/passport/passport-stamp-bow.png  | 52:18863   | png  | Transparent stamp bow   |
