/** Figura vectorial de Quirón (recreación para UI; no es un SVG exportado de la lámina). */
export function QuironFigure({ className, bubble = true }: { className?: string; bubble?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <path d="M28 52c0-24 16-40 36-40s36 16 36 40" stroke="#0a0a0a" strokeWidth="7" strokeLinecap="round" />
      <circle cx="28" cy="58" r="14" fill="#fff" stroke="#0a0a0a" strokeWidth="4" />
      <circle cx="100" cy="58" r="14" fill="#fff" stroke="#0a0a0a" strokeWidth="4" />
      <circle cx="28" cy="58" r="6" fill="#f5004f" />
      <circle cx="100" cy="58" r="6" fill="#f5004f" />
      <ellipse cx="64" cy="56" rx="34" ry="32" fill="#fff" stroke="#0a0a0a" strokeWidth="4" />
      <ellipse cx="64" cy="58" rx="28" ry="22" fill="#f5004f" stroke="#0a0a0a" strokeWidth="3.5" />
      <path d="M48 60c4-8 12-8 16 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M64 60c4-8 12-8 16 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 88c8 18 40 22 52 0" fill="#fff" stroke="#0a0a0a" strokeWidth="3.5" />
      <circle cx="64" cy="90" r="6" fill="#f5004f" stroke="#0a0a0a" strokeWidth="2.5" />
      {/* arrows hint */}
      <path d="M92 78l6-14M98 80l5-12M104 82l4-10" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      <path d="M94 64l4-3 2 5M100 68l3-3 2 4M105 72l3-2 1 3" fill="#fff" stroke="#0a0a0a" strokeWidth="1.5" />
      {bubble ? (
        <g className="quiron-bubble-layer">
          <ellipse cx="106" cy="30" rx="14" ry="11" fill="#f5004f" stroke="#0a0a0a" strokeWidth="2.5" />
          <circle cx="100" cy="30" r="2.2" fill="#fff" />
          <circle cx="106" cy="30" r="2.2" fill="#fff" />
          <circle cx="112" cy="30" r="2.2" fill="#fff" />
        </g>
      ) : null}
    </svg>
  )
}
