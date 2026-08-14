/**
 * 여권 표기명으로 다듬는다.
 *
 * 여권은 영문 대문자로만 적는다. 이름에 실제로 쓰이는 공백과 하이픈,
 * 아포스트로피(O'BRIEN, SMITH-JONES)는 남기고 나머지는 걸러낸다. 대소문자를
 * 가리지 않고 받아 대문자로 올리므로 사용자가 shift를 신경 쓸 필요가 없다.
 *
 * 회원가입과 여권 이름 수정이 같은 규칙을 써야 해서 한곳에 둔다.
 */
export function toPassportName(value) {
  // \s는 탭과 줄바꿈, 비분리 공백까지 통과시킨다. 이름에 쓰이는 건 보통 공백뿐이다.
  return value.replace(/[^A-Za-z '-]/g, '').toUpperCase()
}
