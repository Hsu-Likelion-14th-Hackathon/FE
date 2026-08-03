import styles from './App.module.scss'

function App() {
  return (
    <main className="bg-canvas text-ink grid min-h-[var(--mcm-viewport-stable)] place-items-center px-5 py-10 font-sans">
      <section className={`${styles.setupCard} w-full max-w-sm`} aria-labelledby="setup-title">
        <p className="text-muted text-xs font-semibold tracking-[0.16em]">INITIAL SETUP</p>
        <h1 id="setup-title" className="text-ink mt-3 text-2xl font-semibold tracking-tight">
          MCM BOARDING PASS
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          React, Tailwind CSS와 SCSS 개발 환경이 준비되었습니다.
        </p>
      </section>
    </main>
  )
}

export default App
