import styles from './SavePassToast.module.scss'

/**
 * Boarding Pass 저장 완료 토스트 본문.
 * AppToast 셸 안에서 사용. 하단 · duration 자동 페이드아웃.
 */
function SavePassToast() {
  return (
    <div className={styles.root}>
      <span className={styles.icon} aria-hidden="true" />
      <div className={styles.copy}>
        <p className={styles.title}>Boarding Pass 저장이 완료 되었습니다.</p>
        <p className={styles.note}>발급페이지에서 발급받았던 Boarding Pass를 확인할 수 있습니다.</p>
      </div>
    </div>
  )
}

export default SavePassToast
