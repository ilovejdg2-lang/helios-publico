/** Fondo de Historial: degradado y gráfico inclinado. */
export function HistoryBackdrop() {
  return (
    <div className="hist-symbol" aria-hidden="true">
      <svg className="hist-mark" viewBox="0 0 860 640" fill="none">
        <g transform="rotate(-18 470 300)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M150 530h560" stroke="#F0C98A" strokeWidth="18" />
          <path d="M190 530V130" stroke="#F0C98A" strokeWidth="18" />
          <path d="M190 430h520" stroke="#F6E2C0" strokeWidth="8" />
          <path d="M190 330h520" stroke="#F6E2C0" strokeWidth="8" />
          <path d="M190 230h520" stroke="#F6E2C0" strokeWidth="8" />
          <path
            d="M230 420c70-8 90 36 160 28 74-8 96-86 168-92 62-6 96 24 168-78"
            stroke="#E69500"
            strokeWidth="22"
          />
        </g>
      </svg>
    </div>
  )
}
