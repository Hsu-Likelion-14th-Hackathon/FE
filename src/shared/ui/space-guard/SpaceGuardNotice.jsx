import styles from './SpaceGuardNotice.module.scss'

/**
 * 공백을 걷어냈을 때만 나타나는 안내 한 줄.
 *
 * useSpaceGuard의 rejected와 짝이다. role="status"라 스크린리더에도 읽힌다.
 */
export default function SpaceGuardNotice({ show, children }) {
  if (!show) return null
  return (
    <p className={styles.notice} role="status">
      {children}
    </p>
  )
}
