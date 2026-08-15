import { Link } from 'react-router'

import styles from './StateNotice.module.scss'

/**
 * 탑승 안내 카드 — API 상태(로그인 필요·오류·빈 목록)를 알리는 공용 지면.
 *
 * 앱이 쇼핑을 비행으로 은유하므로 상태 안내도 탑승권 스텁으로 그린다. 눈썹
 * 라벨이 상황을 말하고(CHECK-IN·NOTICE·NEXT FLIGHT), 절취선 아래에 무엇이
 * 일어났고 무엇을 하면 되는지를 적는다.
 *
 * @param {object} props
 * @param {string} props.eyebrow 상황 라벨. 대문자로 그대로 찍힌다.
 * @param {string} props.message 무슨 일이 일어났는지 한 줄.
 * @param {string} [props.hint] 어떻게 하면 되는지 한 줄.
 * @param {{ label: string, to?: string, onClick?: () => void }} [props.action]
 *   행동 하나. to면 링크, onClick이면 버튼이다.
 * @param {string} [props.role] 오류면 'alert'. 안내·초대면 비워 둔다.
 */
function StateNotice({ eyebrow, message, hint, action, role }) {
  return (
    <div className={styles.notice} role={role}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <div className={styles.perforation} aria-hidden="true">
        <span className={styles.notch} />
        <span className={styles.notch} />
      </div>
      <p className={styles.message}>{message}</p>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {action ? (
        action.to ? (
          <Link className={styles.action} to={action.to}>
            {action.label}
          </Link>
        ) : (
          <button className={styles.action} type="button" onClick={action.onClick}>
            {action.label}
          </button>
        )
      ) : null}
    </div>
  )
}

export default StateNotice
