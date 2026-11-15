import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocale } from '../i18n'

/** Carrusel horizontal con snap: aparece cuando la fila se llena y desborda. */
export function CarouselStrip({
  children,
  className = '',
  trackClassName = '',
  label,
}: {
  children: ReactNode
  className?: string
  trackClassName?: string
  label?: string
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const overflow = max > 8
    setCanPrev(overflow && el.scrollLeft > 6)
    setCanNext(overflow && el.scrollLeft < max - 6)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    const onScroll = () => sync()
    el.addEventListener('scroll', onScroll, { passive: true })
    const resize = new ResizeObserver(() => sync())
    resize.observe(el)
    const onWin = () => sync()
    window.addEventListener('resize', onWin)
    const id = window.setTimeout(sync, 80)
    return () => {
      el.removeEventListener('scroll', onScroll)
      resize.disconnect()
      window.removeEventListener('resize', onWin)
      window.clearTimeout(id)
    }
  }, [sync, children])

  function step(dir: -1 | 1) {
    const el = trackRef.current
    if (!el) return
    const amount = Math.max(180, Math.round(el.clientWidth * 0.72)) * dir
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className={`carousel${canPrev || canNext ? ' is-overflow' : ''} ${className}`.trim()}>
      {canPrev ? (
        <button
          type="button"
          className="carousel-nav is-prev"
          aria-label={en ? 'Previous' : 'Anterior'}
          onClick={() => step(-1)}
        >
          <ChevronLeft aria-hidden="true" size={20} strokeWidth={2.25} />
        </button>
      ) : null}
      <div
        ref={trackRef}
        className={`carousel-track ${trackClassName}`.trim()}
        role="group"
        aria-label={label}
        tabIndex={canPrev || canNext ? 0 : undefined}
      >
        {children}
      </div>
      {canNext ? (
        <button
          type="button"
          className="carousel-nav is-next"
          aria-label={en ? 'Next' : 'Siguiente'}
          onClick={() => step(1)}
        >
          <ChevronRight aria-hidden="true" size={20} strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  )
}
