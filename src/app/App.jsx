import styles from './App.module.scss'

function App() {
  return (
    <main className="grid [min-height:100dvh] min-h-screen place-items-center px-5 py-10">
      <section className={`${styles.setupCard} w-full max-w-sm`} aria-labelledby="setup-title">
        <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500">INITIAL SETUP</p>
        <h1
          id="setup-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950"
        >
          MCM BOARDING PASS
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          React, Tailwind CSS와 SCSS 개발 환경이 준비되었습니다.
        </p>
      </section>
    </main>
  )
}

export default App
