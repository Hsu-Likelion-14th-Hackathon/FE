import { setAccessToken } from './authToken.js'
import { apiFetch } from './client.js'
import { API } from './endpoints.js'
import { setProfilePending } from './profilePending.js'

/**
 * 인증·회원 API.
 *
 * 로그인·가입·카카오는 토큰 없이 부른다. Swagger는 전역 JWT를 31개 전체에
 * 상속시켜 이 셋도 잠금으로 표시하지만, 아직 토큰이 없는 사람이 부르는
 * 요청이라 그 표기를 그대로 따르면 로그인 자체가 불가능하다.
 */

/**
 * 이미 다른 방식으로 가입된 이메일.
 *
 * 두 방향으로 온다.
 *   1. 카카오로 가입된 이메일로 일반 회원가입을 시도 → POST /auth/signup 실패
 *   2. 일반 가입한 이메일이 카카오 계정과 겹침 → POST /auth/kakao 실패
 *
 * 백엔드가 "이미 다른 방식으로 가입된 이메일입니다. OO 로그인을 이용해주세요"
 * 처럼 어느 쪽으로 가야 하는지까지 담아 준다. 그래서 우리가 문구를 새로 짓지
 * 않고 받은 message를 그대로 보여 준다. 사라지는 토스트도 쓰지 않는다.
 * 다시 읽을 방법이 없으면 "OO 로그인"이라는 안내가 소용없어진다.
 *
 * Swagger는 이 API들의 응답을 200으로만 선언해 오류 계약이 없다. code는
 * 실제 응답에서만 온다.
 */
export const EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED'

/**
 * 이미 추가 정보가 등록된 회원 (POST /auth/profile 409).
 *
 * 실패지만 뜻은 "가입이 끝나 있다"이다. 미완성 표시를 켠 채 두면 보호 구간이
 * 계속 가입 화면으로 돌려보내는 루프가 된다.
 */
export const PROFILE_ALREADY_REGISTERED = 'PROFILE_ALREADY_REGISTERED'

/** `2026-08-25` → `2026 08 25` (여권 지면 표기) */
function toDisplayDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10).replaceAll('-', ' ')
}

function toMember(result) {
  return {
    userId: result.userId ?? null,
    name: result.name ?? '',
    // 백엔드는 ISO 3166-1 alpha-2를 준다. 지면 표기 변환은 화면이 맡는다.
    nationality: (result.nationality ?? '').toUpperCase(),
    birthDate: toDisplayDate(result.birthDate),
    passportNo: result.passportNo ?? '',
  }
}

/**
 * 받은 토큰을 보관소에 넣는다.
 *
 * 화면마다 따로 저장하면 한 곳만 빠뜨려도 로그인은 됐는데 다음 요청이
 * 익명으로 나가는 상태가 된다.
 */
function keepToken(result) {
  setAccessToken(result.accessToken)
  return result
}

/** POST /auth/login */
export async function login({ email, password }) {
  const result = await apiFetch(API.auth.login, {
    method: 'POST',
    body: { email, password },
    auth: false,
    unwrap: true,
  })
  // 일반 로그인이 된다는 건 가입이 끝났다는 뜻이다. 지난 계정이 남긴
  // 미완성 표시가 있으면 여기서 걷어낸다.
  setProfilePending(false)
  return keepToken({ accessToken: result.accessToken, userId: result.userId ?? null })
}

/**
 * POST /auth/signup — 이메일·비밀번호만 받는 1단계
 *
 * 성공해도 아직 가입이 끝난 것이 아니다. 이름·생년월일·국적을 받아
 * POST /auth/profile까지 보내야 여권을 만들 수 있다. 카카오 신규 가입과
 * 이 지점부터 같은 화면을 쓴다.
 */
export async function signup({ email, password }) {
  const result = await apiFetch(API.auth.signup, {
    method: 'POST',
    body: { email, password },
    auth: false,
    unwrap: true,
  })
  // 토큰은 나왔지만 여권 정보(이름·생년월일·국적)는 아직이다. 이 표시가
  // 켜진 동안 보호 구간은 가입 2단계로 돌려보낸다(ProtectedRoute).
  setProfilePending(true)
  return keepToken({ accessToken: result.accessToken, userId: result.userId ?? null })
}

/**
 * POST /auth/kakao
 *
 * 카카오는 인증만 맡는다. 이름·생년월일·국적은 넘어오지 않으므로, 신규
 * 가입이면 우리 화면에서 따로 받아 POST /auth/profile로 보내야 한다.
 * 일반 회원가입도 이메일·비밀번호를 받은 뒤 같은 자리로 합류한다.
 */
export async function loginWithKakao({ code, redirectUri }) {
  const result = await apiFetch(API.auth.kakao, {
    method: 'POST',
    body: { code, redirectUri },
    auth: false,
    unwrap: true,
  })
  // 신규면 signup과 같은 "토큰만 있는" 상태다. 기존 회원이면 반대로, 지난
  // 계정이 남긴 미완성 표시를 걷어낸다.
  setProfilePending(result.isNewUser === true)
  return keepToken({
    accessToken: result.accessToken,
    userId: result.userId ?? null,
    // true면 추가 정보 화면으로 보낸다. 카카오가 주지 않는 값들이다.
    isNewUser: result.isNewUser === true,
  })
}

/**
 * POST /auth/profile — 가입 2단계(추가 정보)
 *
 * 세 필드가 모두 필수다. 부분 입력을 허용하지 않는다.
 */
export async function createProfile({ name, birthDate, nationality }) {
  let result
  try {
    result = await apiFetch(API.auth.profile, {
      method: 'POST',
      body: { name, birthDate, nationality },
      unwrap: true,
    })
  } catch (cause) {
    // "이미 등록됨"도 가입이 끝나 있다는 뜻이다. 표시를 끄지 않으면 보호
    // 구간이 계속 가입 화면으로 돌려보낸다. 어디로 갈지는 화면이 정한다.
    if (cause?.code === PROFILE_ALREADY_REGISTERED) setProfilePending(false)
    throw cause
  }
  // 여권 정보까지 들어갔으니 가입이 끝났다. 보호 구간이 다시 열린다.
  setProfilePending(false)
  return toMember(result)
}

/** GET /users/me — 새로고침 뒤 세션 복원 */
export async function getMe({ signal } = {}) {
  const result = await apiFetch(API.user.me, { unwrap: true, signal })
  return {
    ...toMember(result),
    email: result.email ?? '',
    provider: result.provider ?? null,
    defaultBodyImageUrl: result.defaultBodyImageUrl ?? null,
  }
}

/**
 * PATCH /users/me — 이름·생년월일·국적
 *
 * PATCH지만 세 필드가 모두 필수라 부분 수정이 아니다(UserUpdateRequest).
 * 하나만 고칠 때도 나머지를 함께 보내야 한다.
 */
export async function updateMe({ name, birthDate, nationality }) {
  const result = await apiFetch(API.user.me, {
    method: 'PATCH',
    body: { name, birthDate, nationality },
    unwrap: true,
  })
  return toMember(result)
}

/**
 * PUT /users/me/body-image — 기본 전신 이미지 등록/수정.
 *
 * 전용 업로드 경로는 없다. 피팅 업로드(createUploadUrl → Azure PUT)로 얻은
 * fileKey를 그대로 재사용한다. 등록해 두면 피팅에서 사진 없이(fileKey 생략)
 * 이 이미지를 쓴다.
 */
export async function registerBodyImage(fileKey) {
  const result = await apiFetch(API.user.bodyImage, {
    method: 'PUT',
    body: { fileKey },
    unwrap: true,
  })
  return { bodyImageUrl: result.bodyImageUrl ?? null }
}

/** DELETE /users/me/body-image — 기본 전신 이미지 삭제 */
export async function deleteBodyImage() {
  const result = await apiFetch(API.user.bodyImage, { method: 'DELETE', unwrap: true })
  return { deleted: Boolean(result.deleted) }
}
