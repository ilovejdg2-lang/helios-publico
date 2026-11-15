import { lazy, Suspense, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { DASHBOARD_PATH } from '../../content/landing'
import { publicDifferentiators } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

const BlackHoleScene = lazy(() =>
  import('../../components/public/scenes/BlackHoleScene').then((m) => ({ default: m.BlackHoleScene })),
)

type Ctx = { reduced: boolean }

export function ProyectoPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const items = publicDifferentiators(lang)
  useEffect(() => {
    document.title = en ? 'The project · HELIOS' : 'El proyecto · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="sec-tag">01 / {en ? 'PROJECT' : 'PROYECTO'}</p>
        <p className="pub-kicker">{en ? 'The project' : 'El proyecto'}</p>
        <h1>{en ? 'Continuous care for a human mission' : 'Cuidado continuo para una misión humana'}</h1>
        <p className="pub-lead">
          {en
            ? 'HELIOS proposes connecting preparation, monitoring, and post-mission follow-up in one coherent space-health support experience.'
            : 'HELIOS propone conectar preparación, monitoreo y seguimiento posmisión en una experiencia coherente de acompañamiento en salud espacial.'}
        </p>
      </header>

      <Suspense
        fallback={
          <div className="blackhole-static scene-block" aria-hidden="true" />
        }
      >
        <BlackHoleScene
          reduced={reduced}
          caption={
            en
              ? 'Artistic space exploration resource · not a medical HELIOS process'
              : 'Recurso artístico de exploración espacial · no representa un proceso médico de HELIOS'
          }
        />
      </Suspense>

      <Reveal className="editorial-block rose">
        <h2>{en ? 'The challenge' : 'El reto'}</h2>
        <p>
          {en
            ? 'Health care in space starts before launch and continues after return. Health information, available resources, and communications can end up scattered, which makes continuous follow-up across stages harder.'
            : 'El cuidado de la salud en el espacio comienza antes del lanzamiento y continúa después del regreso. La información de salud, los recursos disponibles y las comunicaciones pueden quedar dispersos, dificultando un seguimiento continuo entre etapas.'}
        </p>
      </Reveal>

      <Reveal className="editorial-block mint" delay={0.05}>
        <h2>{en ? 'What does HELIOS propose?' : '¿Qué propone HELIOS?'}</h2>
        <p>
          {en
            ? 'A support platform that organizes indicators, inventory, consent, and specialized support across Pre-flight, On board, and Post-mission — with transparency about data quality and the scope of the prototype.'
            : 'Una plataforma de acompañamiento que organiza indicadores, inventario, consentimiento y apoyo especializado a lo largo de Preembarque, A bordo y Posmisión — con transparencia sobre la calidad de los datos y el alcance del prototipo.'}
        </p>
      </Reveal>

      <Reveal className="editorial-block lilac" delay={0.08}>
        <h2>{en ? 'What problem does it seek to solve?' : '¿Qué problema busca resolver?'}</h2>
        <p>
          {en
            ? 'Fragmentation between preparation, demonstration telemetry, emotional wellbeing, and later follow-up. HELIOS aims for the crew and the responsible team to consult one mission thread, without presenting invented readings as live clinical data.'
            : 'La fragmentación entre preparación, telemetría de demostración, bienestar emocional y seguimiento posterior. HELIOS busca que la tripulación y el equipo responsable consulten un mismo hilo narrativo de misión, sin presentar lecturas inventadas como datos clínicos en vivo.'}
        </p>
      </Reveal>

      <Reveal className="editorial-block warm" delay={0.1}>
        <h2>{en ? 'What makes it different?' : '¿Qué lo hace diferente?'}</h2>
        <ul className="feature-list">
          {items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}.</strong> {item.text}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="editorial-block space" delay={0.12}>
        <h2>{en ? 'Potential impact' : 'Impacto potencial'}</h2>
        <p>
          {en
            ? 'Better continuity across stages, better-contextualized decisions, and a shared language between the crew and specialized support — always inside a prototype and simulation frame.'
            : 'Mejor continuidad entre etapas, decisiones mejor contextualizadas y un lenguaje común entre tripulación y apoyo especializado — siempre dentro de un marco de prototipo y simulación.'}
        </p>
      </Reveal>

      <Reveal className="editorial-block mint" delay={0.14}>
        <h2>{en ? 'Prototype scope and next steps' : 'Alcance del prototipo y próximos pasos'}</h2>
        <p>
          {en
            ? 'What is implemented today includes a demonstration monitor, simulated scenarios, inventory, alerts, history, and an assistant with visible-source principles. Clinical validation, bulk NASA dataset integration, or real astronaut telemetry need further research and authorization; they are not part of the current MVP.'
            : 'Lo implementado hoy incluye monitor de demostración, escenarios simulados, inventario, alertas, historial y un asistente con principios de fuentes visibles. Capacidades como validación clínica, integración masiva de datasets NASA o telemetría real de astronautas requieren investigación y autorización adicionales; no forman parte del MVP actual.'}
        </p>
        <div className="team-actions" style={{ marginTop: 12 }}>
          <Link className="pub-btn" to="/como-funciona">{en ? 'How it works' : 'Cómo funciona'}</Link>
          <a className="pub-btn-ghost" href={DASHBOARD_PATH}>{en ? 'Enter the system' : 'Acceder al sistema'}</a>
        </div>
      </Reveal>
    </>
  )
}
