/** Tokens de motion y color espacial para el sitio público HELIOS. */
export const SPACE = {
  mint: '#CDEBDD',
  lilac: '#DDD4F3',
  rose: '#F7DCE6',
  warm: '#FAF9F6',
  ink: '#182026',
  space: '#10131E',
  accent: '#F5004F',
  turquoise: '#7ED6C3',
  softLilac: '#B8A6E8',
} as const

export const MOTION = {
  /** Velocidad base de órbitas (radianes / segundo a 60fps nominal). */
  orbit: 0.35,
  planetSpin: 0.18,
  ambientDrift: 0.08,
  particleLife: 1.4,
  tiltMax: 10,
  /** Escala de partículas: móvil / tablet / desktop */
  density: { mobile: 0.55, tablet: 0.75, desktop: 1 },
  dprCap: 1.75,
} as const

export function densityForWidth(width: number) {
  if (width < 700) return MOTION.density.mobile
  if (width < 1100) return MOTION.density.tablet
  return MOTION.density.desktop
}

export function readThemeDark() {
  return document.documentElement.dataset.theme === 'dark'
}

export function motionPaused() {
  return document.documentElement.dataset.reduceMotion === '1' || document.hidden
}
