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
    title: 'Repeat vital signs measurement (demonstration v1)',
    summary: 'Record a new resting measurement using the same or backup equipment.',
    steps: [
      'Confirm that the person is resting and the sensor belongs to this crew member.',
      'Repeat heart rate and, if needed, oxygen saturation or temperature.',
      'Compare the new reading with the recent series. Do not interpret a single number as a diagnosis.',
    ],
    limitation: 'Demonstration procedure. It is not a validated clinical protocol and does not indicate treatment.',
  },
  {
    id: 'proto-demo-v1-symptom-confirm',
    title: 'Confirm symptoms with the person (demonstration v1)',
    summary: 'Ask the person to describe what they feel, when it started and whether activity changed it.',
    steps: [
      'Record fatigue, dizziness or other symptoms in the person’s own words.',
      'Record onset, approximate intensity and what the person was doing.',
      'Leave the report pending human review.',
    ],
    limitation: 'A self-report is data. It is not a system instruction or a diagnosis.',
  },
  {
    id: 'proto-demo-v1-human-review',
    title: 'Escalate for human review (demonstration v1)',
    summary: 'Prepare a summary for the medical team and send it only after human confirmation.',
    steps: [
      'Gather measurements, symptoms, data quality and available resources.',
      'Identify missing information and old or unreliable readings.',
      'Keep guidance in draft until a person queues it.',
    ],
    limitation: 'Neither the local engine nor a model replaces human review.',
  },
] as const

export const DEMO_PROTOCOL_IDS = DEMO_PROTOCOLS.map((protocol) => protocol.id)

export function findProtocol(id: string): DemoProtocol | undefined {
  return DEMO_PROTOCOLS.find((protocol) => protocol.id === id)
}
