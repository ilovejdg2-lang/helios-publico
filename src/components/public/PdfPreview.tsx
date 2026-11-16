import { useEffect, useRef, useState } from 'react'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export function PdfPreview({ href, en }: { href: string; en: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    setStatus('loading')
    const root = rootRef.current
    root?.replaceChildren()
    async function load() {
      try {
        const pdfjs = await import('pdfjs-dist')
        if (cancelled || !root) return
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        const task = pdfjs.getDocument({ url: href })
        dispose = () => { void task.destroy() }
        const pdf = await task.promise
        for (let index = 1; index <= pdf.numPages; index++) {
          if (cancelled) return
          const page = await pdf.getPage(index)
          if (cancelled) return
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement('canvas')
          canvas.width = Math.ceil(viewport.width)
          canvas.height = Math.ceil(viewport.height)
          canvas.setAttribute('role', 'img')
          canvas.setAttribute('aria-label', `${en ? 'Page' : 'P?gina'} ${index} / ${pdf.numPages}`)
          await page.render({ canvas, viewport }).promise
          if (cancelled) return
          root.appendChild(canvas)
          if (index === 1) setStatus('ready')
          page.cleanup()
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    void load()
    return () => { cancelled = true; dispose?.() }
  }, [href, en, attempt])

  return <>
    <div ref={rootRef} className="pdf-preview-pages" />
    {status === 'loading' && <p role="status">{en ? 'Loading PDF?' : 'Cargando PDF?'}</p>}
    {status === 'error' && <div role="alert">
      <p>{en ? 'Unable to display the PDF.' : 'No se pudo mostrar el PDF.'}</p>
      <button className="pub-btn-ghost" onClick={() => setAttempt(value => value + 1)}>{en ? 'Try again' : 'Reintentar'}</button>
      <a className="pub-btn-ghost" href={href} download>{en ? 'Download PDF' : 'Descargar PDF'}</a>
    </div>}
  </>
}
