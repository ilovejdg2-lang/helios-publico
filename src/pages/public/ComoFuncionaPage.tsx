import { lazy, Suspense, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { publicCapabilities, publicPrinciples, publicQuestions, publicStages } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

const OrbitalMission = lazy(() =>
  import('../../components/public/scenes/OrbitalMission').then((m) => ({ default: m.OrbitalMission })),
)

const CAPABILITIES = [
  {
    title: 'Quirón Bot',
    text: 'Asistente de consulta orientado a evidencias disponibles en el prototipo. Responde con fuentes visibles, reconoce datos faltantes y no inventa certeza clínica.',
    tone: 'lilac' as const,
  },
  {
    title: 'Calidad de datos',
    text: 'Las mediciones de demostración se acompañan de antigüedad, integridad y contexto para evitar leer un número aislado como verdad absoluta.',
    tone: 'mint' as const,
  },
  {
    title: 'Inventario y recursos',
    text: 'Seguimiento de recursos propuestos, aprobados o faltantes vinculados a la preparación de la misión.',
    tone: 'rose' as const,
  },
  {
    title: 'Apoyo especializado',
    text: 'Flujos para facilitar revisión humana cuando el contexto lo sugiere, sin sustituir criterio profesional.',
    tone: 'warm' as const,
  },
  {
    title: 'Privacidad y consentimiento',
    text: 'Espacio privado para bienestar emocional con resumen editable antes de cualquier compartición autorizada.',
    tone: 'lilac' as const,
  },
  {
    title: 'Continuidad local y sincronización',
    text: 'Funciones esenciales pueden continuar en local y sincronizar cuando el enlace vuelve a estar disponible.',
    tone: 'mint' as const,
  },
]

type Ctx = { reduced: boolean }

export function ComoFuncionaPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const stages = publicStages(lang)
  const questions = publicQuestions(lang)
  const principles = publicPrinciples(lang)
  const capabilities = en ? publicCapabilities(lang) : CAPABILITIES
  useEffect(() => {
    document.title = en ? 'How it works · HELIOS' : 'Cómo funciona · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">{en ? 'How it works' : 'Cómo funciona'}</p>
        <h1>{en ? 'A continuous cycle of support' : 'Un ciclo continuo de acompañamiento'}</h1>
        <p className="pub-lead">
          {en
            ? 'From preparation to return: each stage has its own scene, examples, and link to the rest of the mission.'
            : 'De la preparación al regreso: cada etapa tiene su escena, sus ejemplos y su vínculo con el resto de la misión.'}
        </p>
      </header>

      <Suspense fallback={<div className="orbital-static scene-block" aria-hidden="true" />}>
        <OrbitalMission stages={stages} reduced={reduced} lang={lang} />
      </Suspense>

      <Reveal className="editorial-block space">
        <h2>{en ? 'Quirón Bot · example questions' : 'Quirón Bot · preguntas de ejemplo'}</h2>
        <ul className="feature-list">
          {questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <div className="highlight-grid" style={{ marginTop: 18 }}>
          {principles.map((item) => (
            <div key={item.title} className="highlight-item" style={{ background: 'rgba(255,255,255,0.06)', color: '#f4f2f8' }}>
              <strong>{item.title}</strong>
              <p style={{ margin: '6px 0 0', fontWeight: 500 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {capabilities.map((item, index) => (
        <Reveal key={item.title} className={`editorial-block ${item.tone}`} delay={index * 0.04}>
          <h2>{item.title}</h2>
          <p>{item.text}</p>
        </Reveal>
      ))}
    </>
  )
}
