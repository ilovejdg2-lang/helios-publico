/** Placeholder ligero mientras carga una ruta diferida. */
export function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite" aria-busy="true">
      <div className="skeleton-grid" aria-hidden="true">
        <span className="skeleton" style={{ height: 22, width: '42%' }} />
        <span className="skeleton" style={{ height: 14, width: '68%' }} />
        <span className="skeleton" style={{ height: 120, width: '100%', borderRadius: 16 }} />
        <span className="skeleton" style={{ height: 14, width: '54%' }} />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
