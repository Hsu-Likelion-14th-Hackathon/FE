import { useState } from 'react'

/**
 * 공백을 받지 않는 입력칸의 한 벌 — 차단·걷어내기·안내 상태.
 *
 * 이메일·비밀번호 네 칸이 같은 정책을 제각각 구현하면 동작이 갈라진다
 * (beforeinput 유무에 따라 커서 위치가 다르게 튀는 식). 수정도 네 곳에
 * 반복해야 한다.
 *
 * 두 겹으로 막는 이유:
 * - `onBeforeInput` — 들어오는 순간 차단. change에서 지우는 방식만 쓰면
 *   크롬이 email 값의 꼬리 공백을 걸러 돌려줘서, 끝에 친 공백이 다음
 *   글자를 칠 때까지 화면에 남는다.
 * - `sanitize`/`sanitizeInPlace` — 붙여넣기·자동완성처럼 beforeinput을
 *   지나치는 경로의 뒷그물.
 *
 * 막거나 걷어낸 순간 `rejected`가 켜진다. 조용히 지우면 지운 적 없는
 * 글자가 사라진 것처럼 보인다 — 안내(SpaceGuardNotice)와 함께 쓴다.
 */
export function useSpaceGuard() {
  const [rejected, setRejected] = useState(false)

  const sanitize = (raw) => {
    const stripped = raw.replace(/\s/g, '')
    setRejected(stripped !== raw)
    return stripped
  }

  return {
    rejected,
    onBeforeInput(event) {
      if (/\s/.test(event.data ?? '')) {
        event.preventDefault()
        setRejected(true)
      }
    },
    /** 제어 입력용 — 걷어낸 값을 돌려준다. */
    sanitize,
    /** 비제어 입력용 — 값을 자리에서 고친다. */
    sanitizeInPlace(event) {
      const stripped = sanitize(event.target.value)
      if (stripped !== event.target.value) event.target.value = stripped
    },
    reset: () => setRejected(false),
  }
}
