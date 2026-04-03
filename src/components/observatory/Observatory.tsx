interface ObservatoryProps {
  className?: string
}

export function Observatory({ className = '' }: ObservatoryProps) {
  return (
    <section
      data-theme="observatory"
      className={`relative min-h-screen flex flex-col items-center justify-center ${className}`}
    >
      {/* Content sits above the fixed canvas (z-index > 0) */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <div
          className="text-xs tracking-[0.4em] uppercase"
          style={{ color: 'var(--dim-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          Welcome to
        </div>

        <h1
          className="text-6xl md:text-8xl font-light tracking-tight leading-none"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: 'var(--dim-text)',
          }}
        >
          The{' '}
          <span style={{ color: 'var(--dim-accent)' }}>Observatory</span>
        </h1>

        <p
          className="max-w-md text-base leading-relaxed"
          style={{ color: 'var(--dim-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}
        >
          An immersive portfolio spanning multiple dimensions.
          <br />
          Choose your realm.
        </p>

        {/* Scroll prompt */}
        <div
          className="mt-12 flex flex-col items-center gap-2 animate-pulse"
          style={{ color: 'var(--dim-text-muted)' }}
        >
          <div className="text-xs tracking-widest uppercase">
            Scroll to explore
          </div>
          <svg
            width="16"
            height="24"
            viewBox="0 0 16 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M8 4v16M2 14l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  )
}
