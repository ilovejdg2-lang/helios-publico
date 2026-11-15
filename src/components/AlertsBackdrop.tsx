/** Fondo del Centro de Alertas: degradado y triángulo de advertencia. */
export function AlertsBackdrop() {
  return (
    <div className="alerts-backdrop" aria-hidden="true">
      <div className="alerts-backdrop-wash" />
      <svg className="alerts-warn" viewBox="0 0 760 760" fill="none">
        <g transform="rotate(-16 390 300)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M168 118c18-8 34 6 40 16" stroke="#C5D7A4" strokeWidth="18" />
          <path d="M620 86c22 6 28 24 18 38" stroke="#C5D7A4" strokeWidth="16" />
          <path d="M96 430c16 10 18 26 6 36" stroke="#B7C98E" strokeWidth="16" />
          <path d="M648 520c-8 20-28 24-42 14" stroke="#C5D7A4" strokeWidth="16" />
          <path
            d="M390 78c18 0 34 10 42 26L612 470c16 32-6 70-42 70H210c-36 0-58-38-42-70L348 104c8-16 24-26 42-26z"
            stroke="#C3D59A"
            strokeWidth="34"
          />
          <path d="M390 214v168" stroke="#C3D59A" strokeWidth="30" />
          <circle cx="390" cy="452" r="16" fill="#C3D59A" />
        </g>
      </svg>
    </div>
  )
}
