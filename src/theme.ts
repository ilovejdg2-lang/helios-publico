import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark'

const KEY = 'helios-theme'
const LEGACY_KEY = 'vitalink-theme'

export function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY)
    if (value === 'dark') return 'dark'
    if (value === 'light') return 'light'
    /* Primera visita o preferencia no explícita → oscuro por defecto */
  } catch {
    /* almacenamiento no disponible */
  }
  return 'dark'
}

export function applyTheme(choice: ThemeChoice): 'light' | 'dark' {
  document.documentElement.dataset.theme = choice
  document.documentElement.style.colorScheme = choice
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    /* se aplica igual en esta visita */
  }
  return choice
}

export function useTheme(): {
  choice: ThemeChoice
  resolved: 'light' | 'dark'
  setChoice: (choice: ThemeChoice) => void
  toggle: () => void
} {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => readThemeChoice())
  const [resolved, setResolved] = useState<'light' | 'dark'>(
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    setResolved(applyTheme(choice))
  }, [choice])

  return {
    choice,
    resolved,
    setChoice: setChoiceState,
    toggle: () => setChoiceState((current) => (current === 'dark' ? 'light' : 'dark')),
  }
}
