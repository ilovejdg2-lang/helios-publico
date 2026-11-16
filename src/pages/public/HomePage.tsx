import { ArrowDown, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { HeroStage } from '../../components/public/HeroStage'
import { MagneticButton } from '../../components/public/MagneticButton'
import { Reveal } from '../../components/public/Reveal'
import { SimConsole } from '../../components/public/SimConsole'
import { TeamPhoto } from '../../components/public/TeamPhoto'
import { DASHBOARD_PATH } from '../../content/landing'
import { publicQuestions, publicStages, publicTeam } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

type Ctx = { reduced: boolean }

export function HomePage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const stages = publicStages(lang)
  const team = publicTeam(lang)
  const questions = publicQuestions(lang).slice(0, 3)

  useEffect(() => {
    document.title = en ? 'HELIOS · Human care beyond Earth' : 'HELIOS · Cuidado humano más allá de la Tierra'
  }, [en])

  return (
    <>
      <section className="home-hero home-hero-v2" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="sec-tag">00 / {en ? 'ENTRY' : 'ENTRADA'}</p>
          <p className="home-badge">{en ? 'HELIOS · Space-health prototype' : 'HELIOS · Prototipo de salud espacial'}</p>
          <h1 id="home-title">
            <motion.span
              className="line-1"
              initial={reduced ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.04 }}
            >
              {en ? 'Human care' : 'El cuidado humano'}
            </motion.span>
            <motion.span
              className="line-2"
              initial={reduced ? false : { opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.65, delay: 0.16 }}
            >
              <span className="title-glow" aria-hidden="true" />
              {en ? 'beyond Earth.' : 'más allá de la Tierra.'}
            </motion.span>
          </h1>
          <motion.p
            className="home-copy"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            {en
              ? 'HELIOS connects preparation, health, and follow-up to support the crew at every stage of the mission.'
              : 'HELIOS conecta preparación, salud y seguimiento para acompañar a la tripulación en cada etapa de su misión.'}
          </motion.p>
          <motion.div
            className="home-actions"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.36 }}
          >
            <MagneticButton className="pub-btn pub-btn-glow" to="/proyecto" reduced={reduced}>
              {en ? 'Explore HELIOS' : 'Explorar HELIOS'}
            </MagneticButton>
            <MagneticButton className="pub-btn-ghost" to={DASHBOARD_PATH} reduced={reduced}>
              {en ? 'Enter the simulation' : 'Entrar a la simulación'}
            </MagneticButton>
          </motion.div>
          <p className="home-scroll">
            <span className="home-scroll-dot" aria-hidden="true" />
            {en ? 'Keep exploring' : 'Continuar explorando'}
            <ArrowDown size={16} aria-hidden="true" />
          </p>
        </div>
        <HeroStage reduced={reduced} />
      </section>

      <Reveal as="section" className="home-section mission-block" aria-labelledby="stages-title">
        <div className="section-head">
          <p className="sec-tag">01 / {en ? 'MISSION' : 'MISIÓN'}</p>
          <h2 id="stages-title">{en ? 'One mission, three stages' : 'Una misión, tres etapas'}</h2>
          <p className="pub-lead">
            {en
              ? 'Preparation, in-flight support, and continuity after return — drawn as a conceptual trajectory.'
              : 'Preparación, acompañamiento a bordo y continuidad después del regreso — trazados como trayectoria conceptual.'}
          </p>
        </div>

        <div className="mission-path">
          <svg className="mission-path-svg" viewBox="0 0 960 220" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path
              className={reduced ? undefined : 'path-draw'}
              d="M40 160 C 180 40, 300 40, 320 110 S 480 210, 520 120 S 700 20, 780 90 S 880 160, 920 120"
              fill="none"
              stroke="url(#missionGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="missionGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#CDEBDD" />
                <stop offset="50%" stopColor="#DDD4F3" />
                <stop offset="100%" stopColor="#F5004F" />
              </linearGradient>
            </defs>
            <circle className="path-node" cx="80" cy="145" r="10" />
            <circle className="path-node" cx="480" cy="150" r="10" />
            <circle className="path-node" cx="860" cy="125" r="10" />
          </svg>
          <div className="mission-nodes">
            {stages.map((stage, index) => (
              <article key={stage.id} className="mission-node-card">
                <div className="mission-illus" data-stage={index + 1} aria-hidden="true">
                  <span />
                </div>
                <p className="sec-tag">0{index + 1}</p>
                <h3>{stage.title}</h3>
                <p>{stage.lead}</p>
                <Link className="pub-btn-ghost" to="/como-funciona">
                  {en ? 'How it works' : 'Cómo funciona'} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="home-section quiron-block" aria-labelledby="quiron-title">
        <div className="quiron-layout">
          <div className="quiron-core" aria-hidden="true">
            <div className="quiron-orb" />
            <div className="quiron-ring" />
            <div className="quiron-wave">
              <span /><span /><span /><span /><span />
            </div>
            <strong>Quirón Bot</strong>
            <p>{en ? 'Assistance demo' : 'Demo de asistencia'}</p>
          </div>
          <div>
            <p className="sec-tag">02 / {en ? 'ASSIST' : 'ASISTENCIA'}</p>
            <h2 id="quiron-title">{en ? 'Guidance with visible sources' : 'Orientación con fuentes visibles'}</h2>
            <p className="pub-lead">
              {en
                ? 'A visual interface for consultation: evidence, resources, and follow-up. Demonstration only — not a live clinical chat.'
                : 'Una interfaz visual de consulta: evidencia, recursos y seguimiento. Solo demostración — no es un chat clínico en vivo.'}
            </p>
            <ul className="quiron-questions">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <div className="quiron-links">
              <span>{en ? 'Evidence' : 'Evidencia'}</span>
              <span>{en ? 'Resources' : 'Recursos'}</span>
              <span>{en ? 'Follow-up' : 'Seguimiento'}</span>
            </div>
            <Link className="pub-btn" to="/como-funciona">
              {en ? 'See how it works' : 'Ver cómo funciona'} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="home-section dash-preview-block" aria-labelledby="dash-title">
        <div className="section-head">
          <p className="sec-tag">03 / {en ? 'SYSTEM' : 'SISTEMA'}</p>
          <h2 id="dash-title">{en ? 'Step into the simulation' : 'Entrá a la simulación'}</h2>
          <p className="pub-lead">
            {en
              ? 'Play with the console: modules react to you, vitals tick, and each door opens a live HELIOS screen.'
              : 'Jugá con la consola: los módulos reaccionan, los vitales laten y cada puerta abre una pantalla real de HELIOS.'}
          </p>
        </div>
        <SimConsole reduced={reduced} en={en} />
      </Reveal>

      <Reveal as="section" className="home-section team-block" aria-labelledby="team-home-title">
        <div className="section-head">
          <p className="sec-tag">04 / {en ? 'CREW' : 'EQUIPO'}</p>
          <h2 id="team-home-title">{en ? 'Meet the team' : 'Conocé al equipo'}</h2>
          <p className="pub-lead">
            {en
              ? 'Swipe the crew carousel, then open any profile for the full biography.'
              : 'Deslizá el carrusel del equipo y abrí cualquier perfil para la biografía completa.'}
          </p>
        </div>
        <div className="team-gallery" role="list" aria-label={en ? 'Team carousel' : 'Carrusel del equipo'}>
          {team.map((member, index) => (
            <Link
              key={member.id}
              className="team-gallery-card"
              to={`/nosotros/${member.slug}`}
              style={{ animationDelay: `${index * 60}ms` }}
              role="listitem"
            >
              <figure className="team-gallery-photo">
                <TeamPhoto member={member} />
              </figure>
              <div>
                <h3>{member.name}</h3>
                <p>{member.title}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="team-gallery-hint" aria-hidden="true">
          {en ? 'Swipe to see more →' : 'Deslizá para ver más →'}
        </p>
        <Link className="pub-btn-ghost" to="/nosotros">
          {en ? 'About us' : 'Acerca de nosotros'} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Reveal>

      <Reveal as="section" className="home-section close-block" aria-labelledby="close-title">
        <div className="close-horizon" aria-hidden="true">
          <div className="close-planet" />
          <div className="close-halo" />
        </div>
        <div className="close-copy">
          <p className="sec-tag">05 / {en ? 'NEXT' : 'SIGUIENTE'}</p>
          <h2 id="close-title">{en ? 'Enter the HELIOS system' : 'Entrá al sistema HELIOS'}</h2>
          <p className="pub-lead">
            {en
              ? 'Explore the project narrative or jump into the simulated mission environment.'
              : 'Explorá la narrativa del proyecto o saltá al entorno de misión simulado.'}
          </p>
          <div className="home-actions">
            <a className="pub-btn pub-btn-glow" href={DASHBOARD_PATH}>
              {en ? 'Enter the simulation' : 'Entrar a la simulación'}
            </a>
            <Link className="pub-btn-ghost" to="/proyecto">
              {en ? 'The project' : 'El proyecto'}
            </Link>
          </div>
        </div>
      </Reveal>
    </>
  )
}
