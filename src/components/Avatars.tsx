import type { CrewId } from '../../shared/types'

const FACES: Record<CrewId, { skin: string; hair: string; accent: string }> = {
  'elena-torres': { skin: '#e7b89a', hair: '#3b2a24', accent: '#e6004d' },
  'mateo-ruiz': { skin: '#c68642', hair: '#2a2118', accent: '#8a5a2b' },
  'sofia-chen': { skin: '#f0c7a8', hair: '#1d1a17', accent: '#111111' },
  'alex-morgan': { skin: '#f1d2b6', hair: '#d7b07a', accent: '#5c5c5c' },
}

export function Avatar({ id, name }: { id: CrewId; name: string }) {
  const face = FACES[id]
  return (
    <svg className="avatar" viewBox="0 0 64 64" aria-hidden="true">
      <title>{name}</title>
      <circle cx="32" cy="32" r="32" fill={face.accent} />
      <circle cx="32" cy="28" r="12" fill={face.skin} />
      <path d="M16 56c4-10 10-14 16-14s12 4 16 14" fill={face.skin} />
      <path d="M20 24c2-10 22-12 26-2 1 8-4 6-8 4-6-4-12-2-16 1-2-4-3-6-2-3z" fill={face.hair} />
    </svg>
  )
}

export function ResourceMark({ id }: { id: string }) {
  const common = { viewBox: '0 0 64 64', className: 'resource-mark', 'aria-hidden': true as const }
  if (id === 'bp-cuff') {
    return (
      <svg {...common}>
        <rect x="10" y="22" width="44" height="18" rx="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 22v-6a14 14 0 0 1 28 0v6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    )
  }
  if (id === 'thermometer') {
    return (
      <svg {...common}>
        <rect x="28" y="8" width="8" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="32" cy="48" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    )
  }
  if (id === 'eval-kit') {
    return (
      <svg {...common}>
        <rect x="12" y="18" width="40" height="30" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 18v-4h16v4M32 28v12M26 34h12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    )
  }
  if (id === 'supplement') {
    return (
      <svg {...common}>
        <rect x="22" y="10" width="20" height="44" rx="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M22 32h20" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="16" y="22" width="32" height="20" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="40" cy="32" r="4" fill="currentColor" />
    </svg>
  )
}

export function Ecg() {
  return (
    <svg className="ecg" viewBox="0 0 360 72" aria-hidden="true">
      <path className="ecg-path" d="M0 36h40l8-16 8 32 8-22 8 6h28l8-16 8 32 8-22 8 6h28l8-16 8 32 8-22 8 6h28l8-16 8 32 8-22 8 6H360" />
    </svg>
  )
}
