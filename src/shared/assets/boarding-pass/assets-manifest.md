# 보딩패스 에셋 manifest

최종 갱신: 2026-08-05 (SA-ASSET)
규칙: 화면 에이전트는 이 표에 등재된 경로만 import 한다. 미등재 에셋이 필요하면 blocked로 보고. 기존 키 rename 금지, append만 허용.

피그마 fileKey: `tSI6iLHljEEKlW4epXCkfq` (기준 캔버스 390×844)

## 공통 (icons/)

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| icon-menu | src/shared/assets/boarding-pass/icons/menu.svg | 472:4759 | svg | 헤더 좌측 메뉴 (전 화면 공통) |
| icon-search | src/shared/assets/boarding-pass/icons/search.svg | 472:4763 | svg | 헤더 검색 (전 화면 공통) |
| icon-heart | src/shared/assets/boarding-pass/icons/heart.svg | 472:4768 | svg | 헤더 위시리스트 (전 화면 공통) |
| icon-cart | src/shared/assets/boarding-pass/icons/cart.svg | 472:4770 | svg | 헤더 장바구니 (전 화면 공통) |
| logo-mcm-wordmark | src/shared/assets/boarding-pass/icons/mcm-wordmark.svg | 472:4772 | svg | 헤더 중앙 MCM 워드마크 로고 (전 화면 공통) |
| icon-diamond | src/shared/assets/boarding-pass/icons/diamond.svg | 472:4782 | svg | "MCM BOARDING PASS" 타이틀 좌우 다이아몬드 장식 (전 화면 공통) |

## intro/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| intro-ticket-logo | src/shared/assets/boarding-pass/intro/ticket-logo.png | 472:4805 | png | (22) 인트로 티켓 카드 하단 MCM 로렐 엠블럼 |
| intro-ribbon-strap | src/shared/assets/boarding-pass/intro/ribbon-strap.png | 472:4811 | png | (22) 인트로 하단 MCM 리본 스트랩 이미지 |
| intro-ribbon-bow | src/shared/assets/boarding-pass/intro/ribbon-bow.png | 472:4812 | png | (22) 인트로 티켓 카드 위 MCM 리본 보(bow) 이미지 |

## landing/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| landing-plane | src/shared/assets/boarding-pass/landing/plane.png | 502:4974 | png | (23) 랜딩 중앙 MCM 비행기 히어로 이미지 |

## survey/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| survey-q-plane | src/shared/assets/boarding-pass/survey/q-plane.svg | 508:5360 | svg | (24)~(29) 질문 라벨(Q1~Q3) 좌측 비행기 아이콘 ((24) 기준 노드, 각 설문 프레임에 동일 노드 반복) |

## issue/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| issue-loading-spinner | src/shared/assets/boarding-pass/issue/loading-spinner.svg | 611:7687 | svg | (30)~(32) 발급 로딩 "Loading" 텍스트 옆 점 3개 스피너 |
| issue-loading-symbol | src/shared/assets/boarding-pass/issue/loading-symbol.svg | 611:7688 | svg | (30)~(32) 발급 로딩 중앙 MCM 로딩 심볼 |
| issue-plane-route | src/shared/assets/boarding-pass/issue/plane-route.svg | 532:6210 | svg | 티켓 ICN→MUC 사이 비행기+점선 항로 아이콘 ((33)(35)~(37)(42) 티켓 공통) |
| issue-barcode | src/shared/assets/boarding-pass/issue/barcode.png | 532:6218 | png | (33) 완료 티켓 하단 바코드 ((35)~(37)(42) 재사용) |
| issue-qrcode | src/shared/assets/boarding-pass/issue/qrcode.png | 532:6219 | png | (33) 완료 티켓 하단 QR 코드 ((35)~(37)(42) 재사용) |
| issue-ticket-stamp | src/shared/assets/boarding-pass/issue/ticket-stamp.png | 573:6226 | png | (33) 티켓 우상단 원형 MCM 스탬프 ((35)~(37)(42) 재사용) |

## scan/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| scan-point-scan | src/shared/assets/boarding-pass/scan/point-scan.svg | 576:6470 | svg | (35) 스캔 대기 상태 중앙 point-scan 아이콘 |
| scan-button-icon | src/shared/assets/boarding-pass/scan/scan-button-icon.svg | 576:6454 | svg | (35) "평가용 탑승권 스캔 시뮬레이션" 버튼 좌측 스캔 프레임 아이콘 |
| scan-check-circle | src/shared/assets/boarding-pass/scan/check-circle.svg | 576:6699 | svg | (36)(37) SUCCESS SCAN 체크 서클 아이콘 |
| scan-credit-icon | src/shared/assets/boarding-pass/scan/credit-icon.svg | 583:6817 | svg | (37) 크레딧 지급 토스트 좌측 체크 아이콘 |

## flight/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| flight-map | src/shared/assets/boarding-pass/flight/map.png | 635:8155 | png | (41)(43) MAPS 태블릿 프레임 안 서울→뮌헨 지도 이미지 ((42) 재사용) |
| flight-cloud-large | src/shared/assets/boarding-pass/flight/cloud-large.png | 635:8116 | png | (41)~(45) 공통 배경 기체 노즈 데코 (상단 202×151·하단 354×254 동일 이미지 2회 배치) |
| flight-plane-deco | src/shared/assets/boarding-pass/flight/plane-deco.png | 635:8118 | png | (41)~(45) 공통 배경 좌하단 비행기 데코 (캔버스 좌측에서 클리핑되는 형태) |
| flight-deco-right | src/shared/assets/boarding-pass/flight/deco-right.png | 671:8484 | png | (41)(43) 우측 MCM 트렁크(보석함) 데코 이미지 |

## guide/

| 키 | 경로 | 원본 nodeId | 타입 | 사용처 |
| --- | --- | --- | --- | --- |
| guide-deco-top | src/shared/assets/boarding-pass/guide/deco-top.png | 683:8781 | png | (44) 가이드 개요 우상단 MCM 비행기 데코 이미지 |
| guide-overview-main | src/shared/assets/boarding-pass/guide/overview-main.png | 683:8782 | png | (44) 가이드 개요 좌측 메인 MCM HAUS 건물 이미지 |
| guide-overview-figure | src/shared/assets/boarding-pass/guide/overview-figure.png | 683:8794 | png | (44) 가이드 개요 우측 화살표 참(charm) 장식 이미지 |
