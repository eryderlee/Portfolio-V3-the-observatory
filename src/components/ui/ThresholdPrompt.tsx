interface ThresholdPromptProps {
  label: string
  heading: string
  description: string
  dimAccentColor?: string
}

export function ThresholdPrompt({
  label,
  heading,
  description,
  dimAccentColor,
}: ThresholdPromptProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center px-6">
      <div
        className="text-xs tracking-[0.5em] uppercase"
        style={{
          color: dimAccentColor ?? 'var(--dim-accent)',
          fontFamily: 'var(--dim-font-primary)',
        }}
      >
        {label}
      </div>

      <h2
        className="text-4xl md:text-5xl font-light leading-tight"
        style={{
          color: 'var(--dim-text)',
          fontFamily: 'var(--dim-font-primary)',
        }}
      >
        {heading}
      </h2>

      <p
        className="max-w-sm text-sm leading-relaxed"
        style={{
          color: 'var(--dim-text-muted)',
          fontFamily: 'var(--dim-font-secondary)',
        }}
      >
        {description}
      </p>

      {/* Threshold line */}
      <div
        className="mt-4 w-px h-16"
        style={{ background: 'var(--dim-accent)', opacity: 0.4 }}
        aria-hidden="true"
      />
    </div>
  )
}
