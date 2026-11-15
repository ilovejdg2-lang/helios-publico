import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

type LazySceneProps = {
  reduced: boolean
  fallback: ReactNode
  children: ReactNode
}

/** Contenedor visual de respaldo mientras carga una escena diferida. */
export function SceneFallback({ label }: { label: string }) {
  return (
    <div className="scene-fallback" aria-hidden="true">
      <div className="scene-fallback-core" />
      <p>{label}</p>
    </div>
  )
}

export function LazyScene({ reduced, fallback, children }: LazySceneProps) {
  if (reduced) return <>{fallback}</>
  return <Suspense fallback={fallback}>{children}</Suspense>
}

export function lazyScene<T extends ComponentType<object>>(loader: () => Promise<{ default: T }>) {
  return lazy(loader)
}
