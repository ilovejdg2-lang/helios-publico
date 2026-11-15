import { AnimatePresence, motion } from 'motion/react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { Suspense, useEffect, useId, useState } from 'react'
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom'
import { DASHBOARD_PATH } from '../../content/landing'
import { publicNav } from '../../content/publicCopy'
import { useLocale } from '../../i18n'
import { useMotionPref } from '../../hooks/useMotionPref'
import { useTheme } from '../../theme'
import { RouteFallback } from '../RouteFallback'
import { HeliosLogo } from '../HeliosLogo'
import { NasaSpaceAppsMark } from './NasaSpaceAppsMark'
import { Starfield } from './Starfield'
import '../../public.css'

function PublicPageTransition({ reduced }: { reduced: boolean }) {
  const location = useLocation()
  const outlet = useOutlet({ reduced })

  return (
    <Suspense fallback={<RouteFallback />}>
      <motion.div
        key={location.pathname}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {outlet}
      </motion.div>
    </Suspense>
  )
}

export function PublicLayout() {
  const { lang, setLang } = useLocale()
  const en = lang === 'en'
  const nav = publicNav(lang)
  const { resolved, toggle } = useTheme()
  const { reduced } = useMotionPref()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }, [location.pathname, reduced])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduced ? '1' : '0'
  }, [reduced])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="pub">
      <Starfield reduced={reduced} />
      <div className="pub-shell">
        <header className="pub-header">
          <Link className="pub-brand" to="/" onClick={() => setMenuOpen(false)} aria-label={en ? 'HELIOS, home' : 'HELIOS, inicio'}>
            <HeliosLogo variant="wordmark" />
          </Link>

          <nav className="pub-nav" aria-label={en ? 'Public navigation' : 'Navegación pública'}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
                <span className="pub-nav-indicator" aria-hidden="true" />
              </NavLink>
            ))}
          </nav>

          <div className="pub-actions">
            <div className="pub-lang" role="group" aria-label={en ? 'Language' : 'Idioma'}>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
              <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
            </div>
            <button
              type="button"
              className="theme-toggle pub-theme"
              data-testid="theme-toggle"
              aria-label={resolved === 'dark' ? (en ? 'Switch to light mode' : 'Activar modo claro') : (en ? 'Switch to dark mode' : 'Activar modo oscuro')}
              onClick={toggle}
            >
              <span className="pub-theme-swap" data-mode={resolved}>
                {resolved === 'dark' ? <Moon aria-hidden="true" size={18} /> : <Sun aria-hidden="true" size={18} />}
              </span>
            </button>
            <button
              type="button"
              className="btn icon-btn pub-menu-btn"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? (en ? 'Close menu' : 'Cerrar menú') : (en ? 'Open menu' : 'Abrir menú')}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            </button>
            <a className="pub-cta" href={DASHBOARD_PATH}>
              <span className="long">{en ? 'Enter the system' : 'Acceder al sistema'}</span>
              <span className="short">{en ? 'Enter' : 'Entrar'}</span>
            </a>
          </div>
        </header>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              id={menuId}
              className="pub-mobile"
              initial={reduced ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {item.label}
                </NavLink>
              ))}
              <a href={DASHBOARD_PATH} onClick={() => setMenuOpen(false)}>{en ? 'Enter the system' : 'Acceder al sistema'}</a>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="pub-main">
          <PublicPageTransition reduced={reduced} />
        </main>

        <footer className="pub-footer">
          <div className="pub-footer-grid">
            <div>
              <p className="pub-kicker">HELIOS</p>
              <p className="pub-footer-title">
                {en
                  ? 'Health Evaluation & Life Indicators Observation System'
                  : 'Sistema de observación de indicadores de salud y de vida'}
              </p>
              <p className="pub-muted">{en ? 'Independent prototype for space-health support. It is not an official NASA product.' : 'Prototipo independiente de acompañamiento en salud espacial. No es un producto oficial de NASA.'}</p>
            </div>
            <nav aria-label={en ? 'Footer' : 'Pie de página'}>
              {nav.map((item) => (
                <Link key={item.to} to={item.to}>{item.label}</Link>
              ))}
              <a href={DASHBOARD_PATH}>{en ? 'System' : 'Sistema'}</a>
            </nav>
          </div>
          <div className="pub-footer-brands" aria-label={en ? 'Challenge and team marks' : 'Marcas del reto y del equipo'}>
            <p className="pub-footer-brands-label">
              {en ? 'Built for NASA Space Apps Challenge' : 'Creado para NASA Space Apps Challenge'}
            </p>
            <div className="pub-footer-brands-row">
              <img
                className="pub-footer-logo pub-footer-logo-astro"
                src="/brand/partners/astro-deep-space.png"
                alt="Astro Deep Space"
                width={220}
                height={120}
                loading="lazy"
                decoding="async"
              />
              <span className="pub-footer-brands-divider" aria-hidden="true" />
              <NasaSpaceAppsMark className="pub-footer-logo pub-footer-logo-nasa" />
            </div>
          </div>
          <p className="pub-footer-note">
            © {new Date().getFullYear()}{' '}
            {en
              ? 'Astro Deep Space Team · NASA Space Apps Challenge Costa Rica 🇨🇷'
              : 'Equipo Astro Deep Space · NASA Space Apps Challenge Costa Rica 🇨🇷'}
          </p>
        </footer>
      </div>
    </div>
  )
}
