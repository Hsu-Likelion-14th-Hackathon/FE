/**
 * sessionStorage에 사는 값 하나 — 읽기·쓰기·구독을 한 벌로 만든다.
 *
 * 토큰(authToken)과 미완성 표시(profilePending)가 같은 장치를 따로 들고
 * 있었다. 두 벌이 되면 한쪽에만 적용한 수정(저장 실패 처리, 구독 정리)이
 * 다른 쪽에 빠지기 쉽다.
 *
 * sessionStorage인 이유: 메모리에만 두면 새로고침 한 번에 사라지고,
 * localStorage면 탭을 닫아도 남는다. 저장이 막힌 환경(사파리 비공개 모드
 * 등)에서도 화면은 떠야 하므로 실패는 삼키고 메모리만 쓴다.
 *
 * @param {string} key sessionStorage 키
 * @param {object} [codec]
 * @param {(raw: string|null) => any} [codec.decode] 저장된 문자열 → 값
 * @param {(value: any) => string|null} [codec.encode] 값 → 저장 문자열. null이면 지운다.
 */
export function createStoredValue(key, { decode = (raw) => raw, encode = (value) => value } = {}) {
  function readStored() {
    try {
      return decode(sessionStorage.getItem(key))
    } catch {
      return decode(null)
    }
  }

  function writeStored(value) {
    try {
      const raw = encode(value)
      if (raw != null) sessionStorage.setItem(key, raw)
      else sessionStorage.removeItem(key)
    } catch {
      // 저장에 실패해도 이번 세션 동안 메모리 값으로 동작한다.
    }
  }

  let value = readStored()

  /** 값이 바뀐 것을 알아야 하는 쪽(인증 UI·라우트 가드)이 구독한다. */
  const listeners = new Set()

  return {
    get: () => value,
    set(next) {
      if (next === value) return
      value = next
      writeStored(next)
      for (const listener of listeners) listener(value)
    },
    /** @returns 구독을 끊는 함수 */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
