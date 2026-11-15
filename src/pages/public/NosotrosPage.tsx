import { ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { TeamPhoto } from '../../components/public/TeamPhoto'
import { publicTeam } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

type Ctx = { reduced: boolean }

export function NosotrosPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const team = publicTeam(lang)
  useEffect(() => {
    document.title = en ? 'About us · HELIOS' : 'Acerca de nosotros · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">{en ? 'About us' : 'Acerca de nosotros'}</p>
        <h1>{en ? 'The team behind HELIOS' : 'El equipo detrás de HELIOS'}</h1>
        <p className="pub-lead">
          {en ? 'Profiles with a real presence: each member has their own space, a large photo, and an individual page.' : 'Perfiles con protagonismo real: cada integrante tiene espacio propio, fotografía amplia y una página individual.'}
        </p>
      </header>

      <div className="team-roster">
        {team.map((member, index) => (
          <Reveal
            key={member.id}
            as="article"
            className={`team-row${index % 2 === 1 ? ' reverse' : ''}`}
            delay={index * 0.05}
          >
            <figure className={`team-photo${reduced ? '' : ' has-halo'}`}>
              <span className="team-halo-ring" aria-hidden="true" />
              <TeamPhoto member={member} />
            </figure>
            <div className="team-copy">
              <p className="pub-kicker">{en ? 'Member' : 'Integrante'}</p>
              <h2>{member.name}</h2>
              <p className="role">{member.title}</p>
              <p>{member.summary}</p>
              <div className="team-actions">
                <Link className="pub-btn" to={`/nosotros/${member.slug}`}>
                  {en ? `Meet ${member.firstName}` : `Conocer a ${member.firstName}`}
                </Link>
                <a className="pub-btn-ghost" href={member.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  )
}
