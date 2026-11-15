import { useCallback, useEffect, useState } from 'react'

/** Pausa el render cuando el nodo sale de pantalla o la pestaña está oculta. */
export function useSceneLifecycle(active: boolean) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(true)
  const [tabVisible, setTabVisible] = useState(() => (typeof document === 'undefined' ? true : !document.hidden))

  const ref = useCallback((el: HTMLElement | null) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (!node || !active) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: '80px', threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [active, node])

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return { ref, node, running: active && visible && tabVisible }
}
