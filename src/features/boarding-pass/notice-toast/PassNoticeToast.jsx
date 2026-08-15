import styles from './PassNoticeToast.module.scss'

/**
 * 보딩패스 알림 토스트 본문.
 * complete 저장 완료 · scan 크레딧 · (23-1) 빈 가방이 같은 레이아웃을 쓴다.
 */
function PassNoticeToast({ icon, title, note }) {
  return (
    <div className={styles.root}>
      <img src={icon} alt="" aria-hidden="true" className={styles.icon} />
      <div className={styles.copy}>
        <p className={styles.title}>{title}</p>
        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
    </div>
  )
}

export default PassNoticeToast
