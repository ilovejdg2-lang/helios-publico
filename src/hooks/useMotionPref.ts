import { useEffect, useState } from 'react'

const KEY = 'helios-reduce-motion'

export function useMotionPref() {
  const [reduced, setReduced] = useState(() => {
    try {
      if (localStorage.getItem(KEY) === '1') return true
    } catch { /* */ }
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      try {
        if (localStorage.getItem(KEY) !== null) return
      } catch { /* */ }
      setReduced(media.matches)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setManual = (value: boolean) => {
    setReduced(value)
    try {
      localStorage.setItem(KEY, value ? '1' : '0')
    } catch { /* */ }
  }

  return { reduced, setManual, toggle: () => setManual(!reduced) }
}
