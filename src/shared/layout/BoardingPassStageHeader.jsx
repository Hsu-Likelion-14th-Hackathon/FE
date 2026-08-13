import closeIcon from '@/shared/assets/boarding-pass/icons/close.svg'
import BoardingPassDocent from '@/shared/ui/BoardingPassDocent.jsx'

import styles from './BoardingPassStageHeader.module.scss'

/** 비행 MAPS / 여행 가이드 공통 — 닫기 + 제목·도슨트 행. 전환 시 높이가 같아야 한다. */
export default function BoardingPassStageHeader({ title, closeLabel, onClose }) {
  return (
    <>
      <button type="button" aria-label={closeLabel} onClick={onClose} className={styles.close}>
        <img src={closeIcon} alt="" className={styles.closeImg} />
      </button>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{title}</h2>
        <BoardingPassDocent />
      </div>
    </>
  )
}
