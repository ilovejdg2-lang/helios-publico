export interface DemoProtocol {
  id: string
  title: string
  summary: string
  steps: string[]
  limitation: string
}

export const DEMO_PROTOCOLS: readonly DemoProtocol[] = [
  {
    id: 'proto-demo-v1-repeat-vitals',
    title: 'Repetir medición de signos (demostración v1)',
    summary: 'Registrar una medición nueva en reposo, con el mismo equipo o uno de respaldo.',
    steps: [
      'Confirmar que la persona está en reposo y que el sensor corresponde al tripulante.',
      'Repetir frecuencia cardíaca y, si hace falta, saturación o temperatura.',
      'Comparar la lectura nueva con la serie reciente. No interpretar una sola cifra como diagnóstico.',
    ],
    limitation: 'Procedimiento de demostración. No es un protocolo clínico validado ni indica un tratamiento.',
  },
  {
    id: 'proto-demo-v1-symptom-confirm',
    title: 'Confirmar síntomas con la persona (demostración v1)',
    summary: 'Pedir a la persona que describa qué siente, desde cuándo y si cambió con la actividad.',
    steps: [
      'Registrar cansancio, mareo u otro síntoma con sus palabras.',
      'Anotar inicio, intensidad aproximada y qué estaba haciendo.',
      'Dejar el reporte pendiente de revisión humana.',
    ],
    limitation: 'El autorreporte es un dato. No es una instrucción para el sistema ni un diagnóstico.',
  },
  {
    id: 'proto-demo-v1-human-review',
    title: 'Escalar a revisión humana (demostración v1)',
    summary: 'Preparar un resumen para el equipo médico y enviarlo solo con confirmación de una persona.',
    steps: [
      'Reunir mediciones, síntomas, calidad de los datos y recursos disponibles.',
      'Marcar qué falta y qué lecturas son antiguas o no confiables.',
      'Dejar la orientación en borrador hasta que una persona la ponga en cola.',
    ],
    limitation: 'La revisión humana no se sustituye por el motor local ni por un modelo.',
  },
] as const

export const DEMO_PROTOCOL_IDS = DEMO_PROTOCOLS.map((protocol) => protocol.id)

export function findProtocol(id: string): DemoProtocol | undefined {
  return DEMO_PROTOCOLS.find((protocol) => protocol.id === id)
}
