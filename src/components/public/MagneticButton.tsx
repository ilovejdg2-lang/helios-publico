import { useRef, type PointerEvent, type ReactNode } from 'react'

type Props = {
  to: string
  children: ReactNode
  className?: string
  reduced?: boolean
}

/** Atracción leve del botón hacia el cursor; la zona de clic permanece estable. */
export function MagneticButton({ to, children, className, reduced }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)

  const onMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const px = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100
    const py = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100
    node.style.setProperty('--mx', `${px}%`)
    node.style.setProperty('--my', `${py}%`)
    node.style.transform = `translate(${dx * 0.12}px, ${dy * 0.16}px)`
  }

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <a
      ref={ref}
      href={to}
      className={`magnetic-btn${className ? ` ${className}` : ''}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="magnetic-btn-glow" aria-hidden="true" />
      {children}
    </a>
  )
}
