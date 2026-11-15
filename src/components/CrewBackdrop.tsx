/** Fondo de Tripulación: degradado, franjas y casco lila. No es la captura. */
export function CrewBackdrop() {
  return (
    <div className="crew-backdrop" aria-hidden="true">
      <div className="crew-backdrop-wash" />
      <div className="crew-backdrop-stripes" />
      <svg className="crew-backdrop-helmet" viewBox="0 0 900 980" fill="none">
        <circle cx="560" cy="250" r="300" fill="#D5C6EA" />
        <circle cx="560" cy="250" r="228" fill="none" stroke="#CDBDE6" strokeWidth="28" />
        <circle cx="560" cy="250" r="156" fill="none" stroke="#C4B3DC" strokeWidth="18" />
        <path
          d="M392 292c28-78 96-132 176-132 92 0 166 70 176 160 6 52-8 96-36 132-34 44-96 78-168 70-78-8-136-58-156-124-14-46-8-78 8-106z"
          fill="#C9B8E2"
        />
        <path
          d="M430 300c22-46 70-78 126-74 48 4 88 36 104 80 10 28 6 54-8 78"
          fill="none"
          stroke="#E4D8F2"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <circle cx="318" cy="360" r="54" fill="#CDBEE6" />
        <circle cx="318" cy="360" r="22" fill="#BBAAD8" />
        <path
          d="M360 470c48 70 150 118 250 112 86-6 156-48 188-108"
          fill="none"
          stroke="#C9B8E2"
          strokeWidth="34"
          strokeLinecap="round"
        />
        <path
          d="M300 560c90 86 250 130 390 104 70-14 124-46 160-88"
          fill="none"
          stroke="#D9CCEE"
          strokeWidth="22"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
