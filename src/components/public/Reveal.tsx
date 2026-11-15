import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'article' | 'header' | 'li'
  style?: CSSProperties
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
  style,
  ...rest
}: RevealProps) {
  const prefersReduced = useReducedMotion()
  const manualReduced = typeof document !== 'undefined' && document.documentElement.dataset.reduceMotion === '1'
  const quiet = Boolean(prefersReduced || manualReduced)

  if (quiet) {
    const Tag = as
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    )
  }

  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
