function RoutePlaceholder({ eyebrow = '라우트 준비 완료', title, description, children }) {
  return (
    <section
      className="grid min-h-[var(--mcm-viewport-stable)] content-center gap-4 px-5 py-10"
      aria-labelledby="route-title"
    >
      <div className="grid gap-3">
        <p className="text-ink text-xs font-semibold tracking-[0.12em]">{eyebrow}</p>
        <h1 id="route-title" className="text-ink text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-ink text-sm leading-6">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default RoutePlaceholder
