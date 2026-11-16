import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyDocumentLocale, readStored, writeStored, type Lang } from './locale'

export type { Lang } from './locale'
export { uiLang } from './locale'

const COPY = {
  es: {
    demoTitle: 'Iniciar la demo de la misión',
    demoLead: 'Guía corta para quien evalúa. No cambia los permisos ni los datos.',
    demoSteps: [
      'Abrí el monitor. El escenario inicial es fatiga gradual: Elena Torres muestra una frecuencia por encima de su línea base. Es simulación.',
      'En Tripulación compará el estado observado con la calidad de la evidencia. No son la misma cosa.',
      'En Alertas abrí el aviso activo. Ahí se ve qué medición lo provocó, qué tan reciente es y qué documento público de NASA lo contextualiza.',
      'En Análisis pedile a Quirón Bot un resumen. La respuesta cita esas fuentes. No es un diagnóstico.',
      'Cambiá el idioma con EN/ES y, si hace falta, el rol simulado. El rol no salta la autorización del servidor.',
    ],
    close: 'Cerrar',
    scienceTitle: 'Explicación científica',
    cause: 'Qué la provocó',
    signals: 'Datos, antigüedad y confianza',
    nasa: 'Documento NASA que contextualiza el problema',
    analysisNasa: 'El análisis usa estas referencias públicas de NASA junto con las lecturas simuladas.',
    shell: {
      monitor: 'Monitor',
      crew: 'Tripulación',
      alerts: 'Alertas',
      resources: 'Recursos',
      history: 'Historial',
      analysis: 'Análisis',
      medical: 'Equipo médico',
      mission: 'Misión',
      risks: 'Riesgos NASA',
      space: 'Mi espacio',
      more: 'Más',
      simulation: 'Simulación',
      linkDown: 'Enlace Tierra: sin conexión',
      linkDelayed: (minutes: number) => `Enlace Tierra: con demora ${minutes} min`,
      linkUp: 'Enlace Tierra: en línea',
      presentation: 'Ir a la presentación',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      themeToLight: 'Activar modo claro',
      themeToDark: 'Activar modo oscuro',
      language: 'Idioma',
      sections: 'Secciones',
      moreSections: 'Más secciones',
      mainSections: 'Secciones principales',
    },
  },
  en: {
    demoTitle: 'Start Mission Demo',
    demoLead: 'Short path for reviewers. It does not change permissions or stored data.',
    demoSteps: [
      'Open Monitor. The default scenario is gradual fatigue: Elena Torres shows a heart rate above her baseline. It is simulated.',
      'On Crew, compare the observed state with evidence quality. They are separate.',
      'On Alerts, open the active notice. It shows which reading triggered it, how recent it is, and which public NASA document frames the problem.',
      'On Analysis, ask Quirón Bot for a summary. The answer cites those sources. It is not a diagnosis.',
      'Switch language with EN/ES and, if needed, the simulated role. The role does not bypass server authorization.',
    ],
    close: 'Close',
    scienceTitle: 'Scientific explanation',
    cause: 'What triggered it',
    signals: 'Data, recency, and reliability',
    nasa: 'NASA document that frames the problem',
    analysisNasa: 'The analysis pairs these public NASA references with the simulated readings.',
    shell: {
      monitor: 'Monitor',
      crew: 'Crew',
      alerts: 'Alerts',
      resources: 'Resources',
      history: 'History',
      analysis: 'Analysis',
      medical: 'Medical team',
      mission: 'Mission',
      risks: 'NASA risks',
      space: 'My space',
      more: 'More',
      simulation: 'Simulation',
      linkDown: 'Earth link: offline',
      linkDelayed: (minutes: number) => `Earth link: delayed ${minutes} min`,
      linkUp: 'Earth link: online',
      presentation: 'Go to the presentation',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      themeToLight: 'Switch to light mode',
      themeToDark: 'Switch to dark mode',
      language: 'Language',
      sections: 'Sections',
      moreSections: 'More sections',
      mainSections: 'Main sections',
    },
  },
}

type ShellCopy = {
  monitor: string
  crew: string
  alerts: string
  resources: string
  history: string
  analysis: string
  medical: string
  mission: string
  risks: string
  space: string
  more: string
  simulation: string
  linkDown: string
  linkDelayed: (minutes: number) => string
  linkUp: string
  presentation: string
  openMenu: string
  closeMenu: string
  themeToLight: string
  themeToDark: string
  language: string
  sections: string
  moreSections: string
  mainSections: string
}

type Copy = {
  demoTitle: string
  demoLead: string
  demoSteps: readonly string[]
  close: string
  scienceTitle: string
  cause: string
  signals: string
  nasa: string
  analysisNasa: string
  shell: ShellCopy
}

const LocaleContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; copy: Copy } | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = readStored()
    if (typeof document !== 'undefined') applyDocumentLocale(initial)
    return initial
  })

  const setLang = useCallback((next: Lang) => {
    applyDocumentLocale(next)
    writeStored(next)
    setLangState(next)
  }, [])

  useEffect(() => {
    applyDocumentLocale(lang)
  }, [lang])

  const value = useMemo(() => ({
    lang,
    setLang,
    copy: COPY[lang],
  }), [lang, setLang])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale fuera de LocaleProvider')
  return value
}
