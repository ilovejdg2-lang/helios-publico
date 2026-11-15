import { describe, expect, it } from 'vitest'
import {
  flareClassHelp,
  formatDonkiWhen,
  structuredDonkiSummary,
} from './donkiCopy'
import type { WeatherEvent } from '../api/environment'

const sample: WeatherEvent = {
  id: '2024-05-10T00:10:00-FLR-001',
  type: 'FLR',
  timestamp: '2024-05-10T00:10Z',
  beginTime: '2024-05-10T00:10Z',
  peakTime: '2024-05-10T00:13Z',
  endTime: '2024-05-10T00:22Z',
  classification: 'C2.8',
  description: 'Note from NASA.',
  sourceUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/1/-1',
  instruments: ['GOES-P: EXIS 1.0-8.0'],
}

describe('donkiCopy', () => {
  it('formats UTC times without inventing medical risk', () => {
    expect(formatDonkiWhen('2024-05-10T00:10Z', 'es')).toMatch(/UTC/)
    expect(flareClassHelp('C2.8', false)).toMatch(/Clase C/)
    expect(flareClassHelp('C2.8', false)).toMatch(/no es una puntuación de riesgo/)
    const summary = structuredDonkiSummary(sample, false)
    expect(summary).toMatch(/Llamarada solar/)
    expect(summary).toMatch(/C2\.8/)
    expect(summary).not.toMatch(/riesgo bajo|evacuación|diagnóstico/i)
  })
})
