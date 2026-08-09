import ticketStampImg from '@/shared/assets/boarding-pass/issue/ticket-stamp.png'

import styles from './TicketStamp.module.scss'

/**
 * 보딩패스 우상단 인장.
 * 흰 채움은 PNG에 베이크(단일 레이어) — plate/ink 분리로 인한 어긋남 없음.
 */
function TicketStamp({ className = '', size = 'md' }) {
  return (
    <div
      className={`${styles.stamp} ${size === 'sm' ? styles.stampSm : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <img src={ticketStampImg} alt="" className={styles.img} />
    </div>
  )
}

export default TicketStamp
