import { useLocation } from 'react-router'

import styles from './MobileShell.module.scss'

const IMMERSIVE_ROOT = '/boarding-pass'

/** 보딩패스 축은 390px 기준 절대배치라 태블릿에서 늘리면 구성이 무너진다. */
function isImmersiveRoute(pathname) {
  return pathname === IMMERSIVE_ROOT || pathname.startsWith(`${IMMERSIVE_ROOT}/`)
}

function MobileShell({ children }) {
  const { pathname } = useLocation()

  return (
    <div
      className={styles.stage}
      data-device-stage
      data-immersive={isImmersiveRoute(pathname) ? '' : undefined}
    >
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
