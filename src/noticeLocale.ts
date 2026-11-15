import type { Lang } from './locale'

// Nest returns these established messages in Spanish. Translate their display
// without changing the authoritative snapshot or executing actions again.
const NOTICES: readonly (readonly [string, string])[] = [
  ['Uso de equipo reutilizable. Las unidades no se descuentan.', 'Reusable equipment use. Units are not deducted.'],
  ['Consumo registrado.', 'Consumption recorded.'],
  ['Ajuste de existencias.', 'Stock adjustment.'],
  ['Borrador guardado. Todavía no está en cola ni fue enviado.', 'Draft saved. It is not queued or sent yet.'],
  ['El mensaje quedó en cola. Aún no fue enviado.', 'The message is queued. It has not been sent yet.'],
  ['Mensajes marcados como enviados. Enviado todavía no es recibido.', 'Messages marked as sent. Sent does not mean received.'],
  ['Recepción confirmada, sin duplicar mensajes.', 'Receipt confirmed, without duplicate messages.'],
  ['Síntomas registrados. Quedan pendientes de revisión humana.', 'Symptoms recorded. Pending human review.'],
]

export function noticeText(text: string, lang: Lang): string {
  const pair = NOTICES.find(([es, en]) => text === es || text === en)
  return pair ? pair[lang === 'en' ? 1 : 0] : text
}
