import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { DASHBOARD_PATH, LANDING_VIDEO } from '../../content/landing'
import { useLocale } from '../../i18n'

type Ctx = { reduced: boolean }

export function VideoPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const title = en ? 'HELIOS project video' : LANDING_VIDEO.title
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    document.title = en ? 'Video · HELIOS' : 'Video · HELIOS'
  }, [en])

  const hasVideo = LANDING_VIDEO.kind !== 'none' && Boolean(LANDING_VIDEO.src)

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">Video</p>
        <h1>{title}</h1>
        <p className="pub-lead">
          {en
            ? 'Audiovisual presentation of the prototype. This resource is separate from the animated scene on the home hero.'
            : 'Presentación audiovisual del prototipo. Este recurso es distinto de la escena animada del hero de inicio.'}
        </p>
      </header>

      <Reveal
        className={`video-stage${playing ? ' is-playing' : ''}${reduced ? ' is-quiet' : ''}`}
        aria-label={en ? 'Project video player' : 'Reproductor del video del proyecto'}
      >
        <div className="video-glow" aria-hidden="true" />
        <div className="video-frame">
          {hasVideo && LANDING_VIDEO.kind === 'youtube' ? (
            <iframe
              title={title}
              src={LANDING_VIDEO.src}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setPlaying(true)}
            />
          ) : hasVideo && LANDING_VIDEO.kind === 'file' ? (
            <video
              controls
              playsInline
              preload="metadata"
              src={LANDING_VIDEO.src}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            >
              <track kind="captions" />
            </video>
          ) : (
            <div>
              <p className="pub-kicker" style={{ color: '#ff6b9a' }}>{en ? 'Coming soon' : 'Próximamente'}</p>
              <h2 style={{ margin: '8px 0 10px', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>
                {en ? 'Presentation video in preparation' : 'Video de presentación en preparación'}
              </h2>
              <p style={{ margin: 0, maxWidth: '42ch', opacity: 0.8 }}>
                {en
                  ? 'When an authorized file exists, this space will show it full size with accessible controls.'
                  : 'Cuando exista un archivo autorizado, este espacio lo mostrará a tamaño completo con controles accesibles.'}
              </p>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal className="team-actions" style={{ marginTop: 24 }}>
        <Link className="pub-btn" to="/proyecto">{en ? 'Explore the project' : 'Explorar el proyecto'}</Link>
        <a className="pub-btn-ghost" href={DASHBOARD_PATH}>{en ? 'Enter the system' : 'Acceder al sistema'}</a>
      </Reveal>
    </>
  )
}
