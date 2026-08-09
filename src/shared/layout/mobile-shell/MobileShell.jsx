import styles from './MobileShell.module.scss'

function MobileShell({ children }) {
  return (
    <div className={styles.stage} data-device-stage>
      <div className={styles.device} data-device-frame>
        <span className={`${styles.hardwareButton} ${styles.actionButton}`} aria-hidden="true" />
        <span className={`${styles.hardwareButton} ${styles.volumeUpButton}`} aria-hidden="true" />
        <span
          className={`${styles.hardwareButton} ${styles.volumeDownButton}`}
          aria-hidden="true"
        />
        <span className={`${styles.hardwareButton} ${styles.powerButton}`} aria-hidden="true" />

        <main className={styles.shell} data-device-screen>
          {children}
        </main>

        <span className={styles.dynamicIsland} aria-hidden="true">
          <i className={styles.islandSensor} />
          <i className={styles.islandCamera} />
        </span>
      </div>
    </div>
  )
}

export default MobileShell
