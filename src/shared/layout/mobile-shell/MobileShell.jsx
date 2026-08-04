import styles from './MobileShell.module.scss'

function MobileShell({ children }) {
  return <main className={styles.shell}>{children}</main>
}

export default MobileShell
