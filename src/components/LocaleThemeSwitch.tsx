import { Moon, Sun } from 'lucide-react'
import { useLocale } from '../i18n'
import { useTheme } from '../theme'

/** Pastilla EN/ES y botón de tema, el mismo control del encabezado público. */
export function LocaleThemeSwitch() {
  const { lang, setLang, copy } = useLocale()
  const { resolved, toggle } = useTheme()
  const shell = copy.shell

  return (
    <div className="locale-theme">
      <div className="lang-switch" role="group" aria-label={shell.language}>
        <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
        <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
      </div>
      <button
        type="button"
        className="theme-toggle"
        data-testid="theme-toggle"
        aria-label={resolved === 'dark' ? shell.themeToLight : shell.themeToDark}
        onClick={toggle}
      >
        {resolved === 'dark'
          ? <Moon aria-hidden="true" size={18} strokeWidth={1.75} />
          : <Sun aria-hidden="true" size={18} strokeWidth={1.75} />}
      </button>
    </div>
  )
}
