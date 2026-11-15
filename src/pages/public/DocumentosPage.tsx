import { Download, Eye, FileText } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { TiltCard } from '../../components/public/TiltCard'
import { publicDocs } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

type Ctx = { reduced: boolean }

export function DocumentosPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const docs = publicDocs(lang)
  const formats = useMemo(() => ['all', ...Array.from(new Set(docs.map((d) => d.format)))], [docs])
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? docs : docs.filter((d) => d.format === filter)

  useEffect(() => {
    document.title = en ? 'Documents · HELIOS' : 'Documentos · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">{en ? 'Documents' : 'Documentos'}</p>
        <h1>{en ? 'Prototype library' : 'Biblioteca del prototipo'}</h1>
        <p className="pub-lead">
          {en
            ? 'Materials organized by title, description, format, and status. View and download appear only when a real file exists.'
            : 'Materiales organizados por título, descripción, formato y estado. Solo se ofrecen acciones de ver o descargar cuando existe un archivo real.'}
        </p>
      </header>

      <div className="docs-filters" role="group" aria-label={en ? 'Filter by format' : 'Filtrar por formato'}>
        {formats.map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? 'is-active' : undefined}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item === 'all' ? (en ? 'All' : 'Todos') : item}
          </button>
        ))}
      </div>

      <div className="docs-grid">
        {visible.map((doc, index) => (
          <TiltCard key={doc.id} as="article" className="doc-card" reduced={reduced}>
            <motion.div
              className="doc-icon"
              aria-hidden="true"
              animate={reduced ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 3.2 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FileText size={22} strokeWidth={1.75} />
            </motion.div>
            <div className="doc-meta">
              <span className="pill">{doc.format}</span>
              <span className="pill lilac">{doc.language}</span>
              {doc.status === 'soon' ? (
                <span className="pill warn">{en ? 'Coming soon' : 'Próximamente'}</span>
              ) : (
                <span className="pill rose">{en ? 'Available' : 'Disponible'}</span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{doc.title}</h2>
            <p className="pub-muted" style={{ margin: 0 }}>{doc.description}</p>
            {doc.href ? (
              <div className="team-actions">
                <a className="pub-btn-ghost" href={doc.href} target="_blank" rel="noreferrer">
                  <Eye size={16} aria-hidden="true" /> {en ? 'View' : 'Ver'}
                </a>
                <a className="pub-btn-ghost" href={doc.href} download>
                  <Download size={16} aria-hidden="true" /> {en ? 'Download' : 'Descargar'}
                </a>
              </div>
            ) : (
              <p className="pub-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                {en ? 'File pending publication.' : 'Archivo pendiente de publicación.'}
              </p>
            )}
          </TiltCard>
        ))}
      </div>

      {visible.length === 0 ? (
        <Reveal>
          <p className="pub-muted">{en ? 'No documents in this category.' : 'No hay documentos en esta categoría.'}</p>
        </Reveal>
      ) : null}
    </>
  )
}
