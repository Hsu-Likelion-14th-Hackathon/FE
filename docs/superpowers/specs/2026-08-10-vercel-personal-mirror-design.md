# Vercel 개인 저장소 미러 배포 설계

## 목표

`Hsu-Likelion-14th-Hackathon/FE`의 `develop` 브랜치가 갱신되면 검증된 소스를 `khy1121/HACKATHON_FE`의 `develop` 브랜치로 자동 동기화한다. Vercel은 개인 저장소의 `develop` 브랜치를 Production Branch로 사용한다.

```text
Organization develop push
  -> GitHub Actions 검증
  -> 개인 저장소 develop 동기화 커밋
  -> Vercel Production 배포
```

## 범위

- Organization 저장소에 동기화 워크플로 하나를 추가한다.
- `develop` push와 수동 실행만 지원한다.
- 개인 저장소는 배포 전용 생성물로 취급한다.
- PR Preview, `main` 동기화, Vercel 프로젝트 자동 생성은 포함하지 않는다.

## 워크플로

1. `verify` job이 Organization 저장소의 `develop`을 체크아웃하고 정확한 commit SHA를 기록한다.
2. 프로젝트 엔진 요구사항에 맞춰 Node.js 22를 준비한다.
3. `npm ci`와 `npm run verify`를 실행한다.
4. 검증이 성공하면 별도의 새 runner에서 `sync` job을 시작하고, 기록한 정확한 SHA를 다시 체크아웃한다.
5. 동기화 단계에만 개인 저장소 토큰을 주입해 개인 저장소를 복제한다.
6. 개인 저장소의 `develop`을 체크아웃하고, 없으면 새로 만든다.
7. 로컬 fetch와 Git index를 사용해 개인 저장소의 다음 commit tree를 원본의 추적 파일과 동일하게 만든다.
   - 파일 복사나 재스테이징을 거치지 않아 ignore·archive 속성의 영향을 받지 않는다.
   - `.github`만 index에서 제거해 미러 저장소에서 워크플로가 재실행되지 않게 한다.
8. 변경이 있을 때만 `khy1121` 계정 명의로 동기화 커밋을 만들고 push한다.

개인 저장소에서 직접 수정한 파일은 다음 동기화에서 원본 상태로 덮어쓴다.

## 인증과 설정

Organization 저장소의 Actions secrets에 다음 값을 등록한다.

| 이름 | 값과 권한 |
| --- | --- |
| `PERSONAL_REPO_TOKEN` | `khy1121/HACKATHON_FE`만 선택하고 `Contents: Read and write`를 허용한 Fine-grained PAT |
| `PERSONAL_GIT_EMAIL` | `khy1121` GitHub 계정에서 검증된 이메일 또는 해당 계정의 noreply 이메일 |

토큰은 검증 job과 분리된 runner의 동기화 단계에서만 사용한다. 깨끗한 GitHub URL과 임시 `GIT_ASKPASS`를 사용해 토큰을 프로세스 인자나 Git remote 설정에 넣지 않는다. 공식 GitHub Actions는 전체 commit SHA로 고정한다. GitHub가 제공하는 Organization 저장소의 `GITHUB_TOKEN`은 다른 소유자의 개인 저장소에 쓸 수 없으므로 사용하지 않는다.

## Vercel 설정

1. `khy1121/HACKATHON_FE`를 개인 Vercel 프로젝트에 연결한다.
2. Production Branch를 `develop`으로 설정한다.
3. `VITE_API_BASE_URL` 등 빌드 환경 변수를 Vercel Production 환경에 등록한다.
4. 백엔드 CORS에 최종 Vercel 도메인을 허용한다.

## 오류 처리

- 설치·린트·포맷·테스트·빌드 중 하나라도 실패하면 개인 저장소를 변경하지 않는다.
- 토큰이 없거나 권한이 부족하면 동기화 단계가 실패하며 원본 저장소에는 영향을 주지 않는다.
- 원본과 개인 저장소의 파일이 같으면 빈 커밋을 만들지 않는다.
- 첫 동기화에서 `.github`를 제외한 원본 tree가 비어 있어도 `develop` root commit을 만든다.
- 개인 저장소 push가 실패하면 Action을 실패 상태로 종료해 로그에서 확인할 수 있게 한다.

## 검증

- 워크플로 YAML을 Prettier로 검사한다.
- 빈 대상 저장소의 최초 동기화와 무변경 재실행을 로컬 Git 저장소로 모사한다.
- 로컬에서 `npm run verify`를 실행한다.
- GitHub secrets 등록 후 워크플로를 수동 실행해 개인 저장소에 `develop`이 생성되는지 확인한다.
- 개인 저장소의 동기화 커밋 작성자가 `khy1121`로 연결되는지 확인한다.
- Vercel에서 해당 커밋의 Production 배포가 시작되는지 확인한다.

## 제약

이 구성은 기술적으로 무료 제공량 안에서 실행될 수 있지만 Vercel Hobby의 사용 정책 준수를 보장하지 않는다. 개인 저장소는 다른 작업의 원본이나 백업으로 사용하지 않는다.
