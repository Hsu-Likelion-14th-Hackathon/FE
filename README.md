# MCM Boarding Pass Frontend

MCM Boarding Pass 해커톤 프로젝트의 모바일 우선 React 프론트엔드입니다.

## 요구 환경

- Node.js 22.12.0 이상
- npm 10 이상

## 실행

```bash
npm install
npm run dev
```

## 검증 명령

```bash
npm run lint
npm run test:run
npm run build
npm run verify
```

`VITE_`로 시작하는 환경 변수는 브라우저 번들에 공개됩니다. 비밀 키나 서버 전용 인증 정보는
`.env` 파일에 넣지 않습니다.

## 스타일링 원칙

- Tailwind CSS는 레이아웃, 간격, 반응형 유틸리티에 사용합니다.
- SCSS Modules는 복잡한 비주얼과 컴포넌트 전용 스타일에 사용합니다.
- Tailwind와 Sass를 같은 파일의 전처리 과정에 섞지 않습니다.

상세 개발 계획은 [프론트엔드 개발 계획](./docs/frontend-development-plan.md)을 참고합니다.
