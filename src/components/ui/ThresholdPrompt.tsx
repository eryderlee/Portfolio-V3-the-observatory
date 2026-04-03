interface ThresholdPromptProps {
  label: string
  heading: string
  description: string
}

export function ThresholdPrompt({ label, heading, description }: ThresholdPromptProps) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen px-8 py-24 text-center overflow-hidden">

      {/* Pulsing radial glow — anchored to accent color via CSS variable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--dim-accent) 16%, transparent), transparent 70%)`,
          animation: 'threshold-pulse 5s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Horizontal divider lines flanking the center */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{ top: 'calc(50% - 80px)' }}
        aria-hidden="true"
      >
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(to right, transparent 0%, var(--dim-accent) 20%, var(--dim-accent) 80%, transparent 100%)`,
            opacity: 0.18,
          }}
        />
      </div>
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{ top: 'calc(50% + 80px)' }}
        aria-hidden="true"
      >
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(to right, transparent 0%, var(--dim-accent) 20%, var(--dim-accent) 80%, transparent 100%)`,
            opacity: 0.18,
          }}
        />
      </div>

      {/* Content stack */}
      <div className="relative flex flex-col items-center gap-7 max-w-5xl">

        {/* Dimension label */}
        <p
          className="text-xs tracking-[0.65em] uppercase"
          style={{
            color: 'var(--dim-accent)',
            fontFamily: 'var(--dim-font-secondary)',
            opacity: 0.6,
          }}
        >
          {label}
        </p>

        {/* Main threshold heading */}
        <h2
          className="text-5xl md:text-7xl lg:text-8xl font-light leading-none"
          style={{
            color: 'var(--dim-text)',
            fontFamily: 'var(--dim-font-primary)',
            textShadow: '0 0 60px var(--dim-accent), 0 0 20px var(--dim-accent)',
            letterSpacing: '-0.01em',
          }}
        >
          {heading}
        </h2>

        {/* Description */}
        <p
          className="text-sm tracking-[0.25em] uppercase"
          style={{
            color: 'var(--dim-text-muted)',
            fontFamily: 'var(--dim-font-secondary)',
          }}
        >
          {description}
        </p>

        {/* Descending vertical thread */}
        <div
          className="mt-4 w-px h-20"
          style={{
            background: `linear-gradient(to bottom, var(--dim-accent), transparent)`,
            opacity: 0.4,
          }}
          aria-hidden="true"
        />
      </div>

      <style>{`
        @keyframes threshold-pulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
