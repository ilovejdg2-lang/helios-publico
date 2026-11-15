import type { ScienceBrief } from '../domain/scienceBrief'
import { useLocale } from '../i18n'

export function SciencePanel({ brief }: { brief: ScienceBrief }) {
  const { copy } = useLocale()
  return (
    <section className="panel science-panel" data-testid="science-panel">
      <h2>{copy.scienceTitle}</h2>
      <h3>{copy.cause}</h3>
      <p>{brief.cause}</p>
      <h3>{copy.signals}</h3>
      {brief.signals.length === 0 ? <p className="muted">{brief.note}</p> : (
        <ul className="science-signals">
          {brief.signals.map((signal) => (
            <li key={signal.label}>
              <strong>{signal.label}</strong> {signal.value}
              <span className="muted"> · {signal.age} · {signal.reliability}</span>
            </li>
          ))}
        </ul>
      )}
      <h3>{copy.nasa}</h3>
      <ul className="science-sources">
        {brief.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
            <p>{source.use}</p>
            <p className="muted">{source.limitation}</p>
          </li>
        ))}
      </ul>
      <p className="callout">{brief.note}</p>
    </section>
  )
}
