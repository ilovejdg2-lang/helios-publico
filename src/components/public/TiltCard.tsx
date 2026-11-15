import { useRef, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from 'react'

type Props = {
  children: ReactNode
  className?: string
  reduced?: boolean
  as?: 'div' | 'article'
  style?: CSSProperties
}

/** Inclinación 3D moderada al cursor; desactivada con reduced motion. */
export function TiltCard({ children, className, reduced, as = 'div', style }: Props) {
  const ref = useRef<HTMLDivElement | HTMLElement | null>(null)

  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const px = (event.clientX - rect.left) / Math.max(rect.width, 1)
    const py = (event.clientY - rect.top) / Math.max(rect.height, 1)
    const rx = (0.5 - py) * 8
    const ry = (px - 0.5) * 10
    node.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`
    node.style.setProperty('--tilt-x', `${px * 100}%`)
    node.style.setProperty('--tilt-y', `${py * 100}%`)
  }

  const onLeave = () => {
    const node = ref.current
    if (!node) return
    node.style.transform = ''
  }

  const shared = {
    className: `tilt-card${className ? ` ${className}` : ''}`,
    style,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    children,
  }

  if (as === 'article') {
    return <article ref={ref as RefObject<HTMLElement>} {...shared} />
  }
  return <div ref={ref as RefObject<HTMLDivElement>} {...shared} />
}
