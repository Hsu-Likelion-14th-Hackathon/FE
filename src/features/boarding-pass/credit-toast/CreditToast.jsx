import creditIcon from '@/shared/assets/boarding-pass/scan/credit-icon.svg'

import styles from './CreditToast.module.scss'

/**
 * 스캔 성공 후 크레딧 지급 토스트 콘텐츠 (37, M-03 UI only).
 * 잔액·Passport 연동 없음. fixture label/note만 표시한다.
 */
function CreditToast({ credit }) {
  const label = credit?.label ?? 'AI 가상 피팅 크레딧'
  const note = credit?.note ?? '비행 종료 후 Passport에서 확인하실 수 있습니다.'

  return (
    <div className={styles.root}>
      <img src={creditIcon} alt="" aria-hidden="true" className={styles.icon} />
      <div className={styles.copy}>
        <p className={styles.title}>{label}이 지급되었습니다</p>
        <p className={styles.note}>{note}</p>
      </div>
    </div>
  )
}

export default CreditToast
