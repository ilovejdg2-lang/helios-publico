import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal" aria-describedby={description ? 'dialog-description' : undefined}>
          <div className="spread">
            <Dialog.Title asChild><h2>{title}</h2></Dialog.Title>
            <Dialog.Close className="btn icon-btn" aria-label="Cerrar">
              <X aria-hidden="true" size={18} strokeWidth={1.75} />
            </Dialog.Close>
          </div>
          {description ? <Dialog.Description id="dialog-description" className="muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">Formulario</Dialog.Description>}
          <div style={{ marginTop: 12 }}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="field-error">{error}</p> : null}
    </div>
  )
}

export function Badge({ tone, children }: { tone?: 'ok' | 'amber' | 'bad'; children: ReactNode }) {
  return <span className={tone ? `badge badge-${tone}` : 'badge'}>{children}</span>
}

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}
