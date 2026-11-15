import type { CrewId } from '../../shared/types'

/** Cascos generados a partir de la referencia visual HELIOS (aprox., no idénticos al original). */
export function CrewHelmet({ id, name, selected }: { id: CrewId; name: string; selected: boolean }) {
  const src = selected ? '/brand/helmet-selected.jpg' : '/brand/helmet-default.jpg'
  return (
    <span className={selected ? 'crew-helmet is-selected' : 'crew-helmet'} data-crew={id} title={name}>
      <img src={src} alt="" width={106} height={106} draggable={false} loading="lazy" decoding="async" />
    </span>
  )
}
