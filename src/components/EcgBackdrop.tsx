import heliosEcgBg from '../assets/helios-ecg-bg.jpg'

/** Fondo de la maqueta HELIOS (degradado rosa + ECG + cuadrícula). */
export function EcgBackdrop() {
  return (
    <div
      className="ecg-backdrop"
      aria-hidden="true"
      style={{ backgroundImage: `url(${heliosEcgBg})` }}
    />
  )
}
