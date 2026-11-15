type HeliosLogoProps = {
  variant?: 'mark' | 'wordmark' | 'app' | 'mark-ink'
  size?: number
  className?: string
}

function PulseDot({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r + 3.4} fill="var(--logo-halo, var(--surface))" />
      <circle cx={cx} cy={cy} r={r} fill={fill} />
    </>
  )
}

/** Marca HELIOS: círculo con trazo ECG y punto superior, separado del círculo. */
export function HeliosLogo({ variant = 'wordmark', size = 72, className }: HeliosLogoProps) {
  if (variant === 'mark' || variant === 'app' || variant === 'mark-ink') {
    const ink = variant === 'mark-ink'
    const fill = ink ? 'var(--ink)' : 'var(--accent)'
    const stroke = ink ? 'var(--surface)' : 'var(--accent-ink)'
    const radius = variant === 'app' ? size * 0.22 : size * 0.5
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 78 74"
        aria-hidden="true"
        focusable="false"
      >
        {variant === 'app' ? (
          <rect width="78" height="74" rx={radius} fill={fill} />
        ) : (
          <circle cx="32" cy="42" r="28" fill={fill} />
        )}
        <path
          d="M10 44h11l5.2-18 7.2 34 5.4-18H56"
          fill="none"
          stroke={stroke}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="miter"
        />
        {variant === 'app' ? (
          <circle cx="62" cy="14" r="8" fill={stroke} />
        ) : (
          <PulseDot cx={62} cy={14} r={8.2} fill={fill} />
        )}
      </svg>
    )
  }

  return (
    <span className={className ? `helios-wordmark ${className}` : 'helios-wordmark'} role="img" aria-label="HELIOS">
      <span className="helios-letters" aria-hidden="true">
        HELI
        <span className="helios-o">
          O
          <svg viewBox="6 12 52 52" width="0.78em" height="0.78em" focusable="false" overflow="visible">
            <circle cx="32" cy="38" r="24" fill="var(--accent)" />
            <path
              d="M10 40h12l5-16 6 26 5-12h14"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="miter"
            />
            <PulseDot cx={54} cy={10} r={7} fill="var(--accent)" />
          </svg>
        </span>
        S
      </span>
    </span>
  )
}
