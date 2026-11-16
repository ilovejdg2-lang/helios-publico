import { PdfPreview } from './PdfPreview'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, Download, Loader2, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type PreviewDoc = {
  title: string
  href: string
}

type Status = 'loading' | 'ready' | 'error'

/**
 * En modo "flujo" (móvil) algunas imágenes del DOCX conservan su ancho fijo de
 * página y se recortan. Se ajustan al ancho disponible manteniendo proporción.
 */
function fitOversizedMedia(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>('section.docx-content')
  if (!section) return
  const available = section.clientWidth
  if (!available) return

  root.querySelectorAll<HTMLElement>('div[style*="width"]').forEach((block) => {
    if (!block.querySelector('img')) return
    if (block.scrollWidth <= available + 1) return
    block.style.width = '100%'
    block.style.maxWidth = '100%'
    block.style.height = 'auto'
    block.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
      image.style.width = '100%'
      image.style.maxWidth = '100%'
      image.style.height = 'auto'
    })
  })

  // Las tablas anchas se recortarían: se envuelven para poder desplazarlas en horizontal
  // y se intentan ajustar al ancho disponible para que se lean sin desplazar.
  root.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    if (table.scrollWidth <= available + 1) return
    const parent = table.parentElement
    if (!parent || parent.classList.contains('docx-scroll')) return
    const scroller = document.createElement('div')
    scroller.className = 'docx-scroll'
    parent.insertBefore(scroller, table)
    scroller.appendChild(table)
    table.style.width = '100%'
    table.style.maxWidth = '100%'
  })
}

/**
 * Visor de documentos dentro de la app.
 *
 * Los visores externos (Google/Office) no funcionan en local ni siempre en móvil,
 * así que los DOCX se renderizan en el navegador con `docx-preview`.
 * Los PDF se abren con el visor nativo del dispositivo desde la página.
 */
export function DocumentPreviewDialog({
  doc,
  open,
  onOpenChange,
  en,
}: {
  doc: PreviewDoc | null
  open: boolean
  onOpenChange: (open: boolean) => void
  en: boolean
}) {
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!open || !doc || doc.href.toLowerCase().endsWith('.pdf')) return
    const href = doc.href
    const controller = new AbortController()
    let cancelled = false
    setStatus('loading')

    async function load() {
      try {
        const response = await fetch(href, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        const { renderAsync } = await import('docx-preview')
        if (cancelled || !bodyRef.current) return

        const narrow = window.matchMedia('(max-width: 900px)').matches
        await renderAsync(blob, bodyRef.current, undefined, {
          className: 'docx-content',
          inWrapper: true,
          breakPages: !narrow,
          ignoreWidth: narrow,
          ignoreHeight: narrow,
          experimental: true,
          useBase64URL: true,
        })
        if (cancelled || !bodyRef.current) return
        if (narrow) fitOversizedMedia(bodyRef.current)
        setStatus('ready')
      } catch {
        if (cancelled) return
        setStatus('error')
      }
    }

    void load()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open, doc, attempt])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="doc-viewer-overlay" />
        <Dialog.Content className="doc-viewer" aria-describedby={undefined}>
          <header className="doc-viewer-head">
            <div className="doc-viewer-heading">
              <Dialog.Title className="doc-viewer-title">{doc?.title ?? ''}</Dialog.Title>
              <p className="doc-viewer-format">{en ? 'DOCX · rendered in your browser' : 'DOCX · visualizado en tu navegador'}</p>
            </div>
            <div className="doc-viewer-tools">
              {doc ? (
                <a
                  className="pub-btn-ghost doc-viewer-download"
                  href={doc.href}
                  download
                  aria-label={en ? 'Download document' : 'Descargar documento'}
                >
                  <Download size={16} aria-hidden="true" />
                  <span>{en ? 'Download' : 'Descargar'}</span>
                </a>
              ) : null}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="doc-viewer-close"
                  aria-label={en ? 'Close viewer' : 'Cerrar visor'}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>
          </header>

          <div className="doc-viewer-body">
            {open && doc?.href.toLowerCase().endsWith('.pdf') ? (
              <PdfPreview href={doc.href} en={en} />
            ) : <div ref={bodyRef} className="doc-viewer-doc" />}

            {!doc?.href.toLowerCase().endsWith('.pdf') && status !== 'ready' ? (
              <div className={`doc-viewer-status${status === 'error' ? ' is-error' : ''}`} role="status">
                {status === 'loading' ? (
                  <>
                    <Loader2 className="doc-viewer-spinner" size={24} aria-hidden="true" />
                    <p>{en ? 'Preparing the document…' : 'Preparando el documento…'}</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={24} aria-hidden="true" />
                    <p>{en ? 'This document could not be displayed here.' : 'No pudimos mostrar este documento aquí.'}</p>
                    <div className="doc-viewer-tools">
                      <button
                        type="button"
                        className="pub-btn-ghost"
                        onClick={() => setAttempt((value) => value + 1)}
                      >
                        <RefreshCw size={16} aria-hidden="true" />
                        {en ? 'Try again' : 'Reintentar'}
                      </button>
                      {doc ? (
                        <a className="pub-btn-ghost" href={doc.href} target="_blank" rel="noreferrer">
                          {en ? 'Open file' : 'Abrir archivo'}
                        </a>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
