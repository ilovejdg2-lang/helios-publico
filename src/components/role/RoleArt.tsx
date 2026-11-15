/** Distinct role illustrations — not the same helmet recolored. */

export function ChiefArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="130" rx="70" ry="14" fill="currentColor" opacity="0.12" />
      <rect x="40" y="70" width="120" height="48" rx="14" stroke="currentColor" strokeWidth="3" fill="color-mix(in srgb, currentColor 12%, transparent)" />
      <path d="M55 70 V52 c0-18 18-30 45-30s45 12 45 30v18" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="48" r="10" fill="#f5004f" stroke="currentColor" strokeWidth="2" />
      <path d="M70 92h60M70 104h40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <circle cx="158" cy="40" r="18" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 5" opacity="0.5" />
      <circle cx="158" cy="40" r="4" fill="#f5004f" />
    </svg>
  )
}

export function CrewArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="132" rx="54" ry="12" fill="currentColor" opacity="0.12" />
      <circle cx="100" cy="72" r="42" stroke="currentColor" strokeWidth="3.5" fill="color-mix(in srgb, currentColor 10%, transparent)" />
      <circle cx="100" cy="72" r="30" stroke="currentColor" strokeWidth="2" opacity="0.45" />
      <path d="M78 78c8 10 36 10 44 0" stroke="#f5004f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="86" cy="66" r="4" fill="currentColor" />
      <circle cx="114" cy="66" r="4" fill="currentColor" />
      <path d="M58 108c8 18 76 18 84 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 48c20-6 40 8 48 22" stroke="currentColor" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
    </svg>
  )
}

export function MedicArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="134" rx="60" ry="12" fill="currentColor" opacity="0.12" />
      <circle cx="72" cy="70" r="22" stroke="currentColor" strokeWidth="3" fill="color-mix(in srgb, currentColor 10%, transparent)" />
      <circle cx="128" cy="70" r="22" stroke="currentColor" strokeWidth="3" fill="color-mix(in srgb, currentColor 10%, transparent)" />
      <path d="M94 70h12M100 94v28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="88" y="118" width="24" height="10" rx="3" fill="#f5004f" />
      <path d="M40 48h20M150 48h20M48 40v16M158 40v16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M55 100c12 8 28 8 40 0" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    </svg>
  )
}

export function PsychArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="134" rx="58" ry="12" fill="currentColor" opacity="0.12" />
      <circle cx="78" cy="78" r="28" stroke="currentColor" strokeWidth="3" fill="color-mix(in srgb, currentColor 12%, transparent)" />
      <circle cx="128" cy="70" r="22" stroke="currentColor" strokeWidth="3" fill="color-mix(in srgb, #f7dce6 40%, transparent)" />
      <path d="M100 86c6 14 22 18 34 8" stroke="#f5004f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="74" r="3.5" fill="currentColor" />
      <circle cx="86" cy="74" r="3.5" fill="currentColor" />
      <path d="M66 88c5 5 14 5 20 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M148 48c10-12 24-8 28 4" stroke="currentColor" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <circle cx="158" cy="40" r="5" fill="#f5004f" opacity="0.8" />
    </svg>
  )
}

export function OrbitalBackdrop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 600" fill="none" aria-hidden="true">
      <ellipse cx="420" cy="300" rx="220" ry="220" stroke="currentColor" strokeWidth="2" opacity="0.18" />
      <ellipse cx="420" cy="300" rx="160" ry="90" stroke="currentColor" strokeWidth="1.5" opacity="0.22" transform="rotate(-24 420 300)" />
      <circle cx="420" cy="300" r="54" fill="currentColor" opacity="0.12" />
      <circle cx="560" cy="210" r="10" fill="#f5004f" opacity="0.55" />
      <circle cx="300" cy="380" r="6" fill="currentColor" opacity="0.35" />
      <path d="M120 480c80-40 160-20 220 10" stroke="currentColor" strokeWidth="2" opacity="0.15" />
    </svg>
  )
}