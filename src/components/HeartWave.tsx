/** Curva suave de FC como en la maqueta (sin ejes ni leyendas). */
export function HeartWave() {
  return (
    <svg className="heart-wave" viewBox="0 0 520 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="hw-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d="M0 78 C40 78 55 78 70 62 C90 38 105 108 125 70 C140 42 155 78 180 78 C210 78 225 48 250 68 C275 88 295 40 320 66 C345 92 365 78 390 78 C430 78 460 58 490 72 L520 78 L520 120 L0 120 Z"
        fill="url(#hw-fill)"
      />
      <path
        d="M0 78 C40 78 55 78 70 62 C90 38 105 108 125 70 C140 42 155 78 180 78 C210 78 225 48 250 68 C275 88 295 40 320 66 C345 92 365 78 390 78 C430 78 460 58 490 72 L520 78"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}