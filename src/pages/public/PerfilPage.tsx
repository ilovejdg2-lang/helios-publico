import { ArrowLeft, ExternalLink } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { TeamPhoto } from '../../components/public/TeamPhoto'
import { teamBySlug } from '../../content/landing'
import { publicMember, publicTeam } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

type Ctx = { reduced: boolean }

export function PerfilPage() {
  const { slug = '' } = useParams()
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const found = teamBySlug(slug)
  const member = found ? publicMember(lang, found) : undefined

  useEffect(() => {
    if (member) document.title = `${member.name} · HELIOS`
  }, [member])

  if (!member) return <Navigate to="/nosotros" replace />

  const others = publicTeam(lang).filter((item) => item.id !== member.id)

  return (
    <>
      <p style={{ margin: '0 0 18px' }}>
        <Link className="pub-btn-ghost" to="/nosotros">
          <ArrowLeft size={16} aria-hidden="true" /> {en ? 'Back to the team' : 'Volver al equipo'}
        </Link>
      </p>

      <section className="profile-hero" aria-labelledby="profile-name">
        <div className={`profile-halo${reduced ? '' : ' is-animated'}`} data-accent={member.accent}>
          <span className="profile-orbit" aria-hidden="true" />
          <TeamPhoto member={member} />
        </div>
        <div className="profile-meta">
          <p className="pub-kicker">{en ? 'Profile' : 'Perfil'}</p>
          <motion.h1
            id="profile-name"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {member.name}
          </motion.h1>
          <p className="role" style={{ marginTop: 0, fontWeight: 650 }}>{member.title}</p>
          <div className="tag-row" style={{ margin: '16px 0' }}>
            {member.tags.map((tag, index) => (
              <motion.span
                key={tag}
                className="tag"
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05, duration: 0.35 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
          <a className="pub-btn" href={member.linkedin} target="_blank" rel="noreferrer">
            LinkedIn <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      {member.highlights?.length ? (
        <Reveal>
          <p className="pub-kicker">{en ? 'Highlights' : 'Destacados'}</p>
          <div className="highlight-grid">
            {member.highlights.map((item) => (
              <div key={item} className="highlight-item">{item}</div>
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal>
        <p className="pub-kicker">{en ? 'Biography' : 'Biografía'}</p>
        <div className="bio-block">{member.bio}</div>
      </Reveal>

      <Reveal className="home-section">
        <p className="pub-kicker">{en ? 'Also on the team' : 'También en el equipo'}</p>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.6rem' }}>{en ? 'Meet the other members' : 'Conocé a otros integrantes'}</h2>
        <div className="others-row">
          {others.map((item) => (
            <Link key={item.id} to={`/nosotros/${item.slug}`}>{item.firstName}</Link>
          ))}
        </div>
      </Reveal>
    </>
  )
}
