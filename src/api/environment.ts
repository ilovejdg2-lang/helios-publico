import { apiUrl } from './baseUrl'
import { z } from 'zod'

const nasaUrl = z
  .string()
  .url()
  .refine((value) => {
    const u = new URL(value)
    return u.protocol === 'https:' && u.hostname.endsWith('.nasa.gov')
  })
const provenance = z.object({
  source: z.string(),
  sourceUrl: nasaUrl,
  fetchedAt: z.string().datetime(),
  cached: z.boolean(),
  historical: z.boolean(),
  simulated: z.literal(false),
  type: z.enum(['SEP', 'FLR', 'CME']).optional(),
})
export const weatherEventSchema = z.object({
  id: z.string(),
  type: z.enum(['SEP', 'FLR', 'CME']),
  timestamp: z.string(),
  beginTime: z.string().nullable().optional(),
  peakTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  classification: z.string().nullable(),
  description: z.string().nullable(),
  sourceUrl: nasaUrl.nullable(),
  instruments: z.array(z.string()).optional(),
  sourceLocation: z.string().nullable().optional(),
  activeRegion: z.string().nullable().optional(),
  linkedEvents: z.array(z.string()).optional(),
  catalog: z.string().nullable().optional(),
})
export const weatherSchema = z.object({
  events: z.array(weatherEventSchema),
  sources: z.array(provenance),
  failures: z
    .array(z.object({ type: z.string(), message: z.string() }))
    .optional(),
  query: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
      type: z.enum(['SEP', 'FLR', 'CME']).optional(),
    })
    .optional(),
})
export const radiationSchema = provenance.extend({
  example: z.boolean().optional(),
  measurements: z.array(
    z.object({
      timestamp: z.string(),
      instrument: z.string(),
      spacecraft: z.string().nullable(),
      absorbedDoseRate: z.number().finite().nullable(),
      doseEquivalentRate: z.number().finite().nullable(),
    }),
  ),
  units: z.object({
    absorbedDoseRate: z.literal('µGy/h'),
    doseEquivalentRate: z.literal('µSv/h'),
  }),
})
export type WeatherEvent = z.infer<typeof weatherEventSchema>
export type WeatherResponse = z.infer<typeof weatherSchema>
export type RadiationResponse = z.infer<typeof radiationSchema>
export async function fetchEnvironmental<T>(
  path: 'donki/events' | 'radlab/measurements' | 'radlab/example',
  query: Record<string, string>,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const timeoutMs = path === 'radlab/measurements' ? 40000 : 20000
  const response = await fetch(
    apiUrl(`/api/nasa/${path}?${new URLSearchParams(query)}`),
    {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs),
    },
  )
  if (!response.ok) throw new Error(`NASA HTTP ${response.status}`)
  return schema.parse(await response.json())
}
