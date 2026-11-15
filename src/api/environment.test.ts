import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  fetchEnvironmental,
  radiationSchema,
  weatherSchema,
} from './environment'
afterEach(() => vi.unstubAllGlobals())
describe('NASA environment boundary', () => {
  it('uses only the Nest endpoint and preserves missing equivalent dose', async () => {
    const payload = {
      source: 'NASA RadLab',
      sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/api',
      fetchedAt: '2026-11-14T12:00:00.000Z',
      cached: false,
      historical: true,
      simulated: false,
      units: { absorbedDoseRate: 'µGy/h', doseEquivalentRate: 'µSv/h' },
      measurements: [
        {
          timestamp: '2023-05-16T00:00:00',
          instrument: 'REM-Lid',
          spacecraft: 'ISS',
          absorbedDoseRate: 9.175176,
          doseEquivalentRate: null,
        },
      ],
    }
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) })
    vi.stubGlobal('fetch', fetcher)
    const data = await fetchEnvironmental(
      'radlab/measurements',
      { instrument: 'REM-Lid' },
      radiationSchema,
    )
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      '/api/nasa/radlab/measurements?instrument=REM-Lid',
    )
    expect(data.measurements[0]?.doseEquivalentRate).toBeNull()
  })
  it('does not manufacture events when offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(
      fetchEnvironmental('donki/events', {}, weatherSchema),
    ).rejects.toThrow('offline')
  })
  it('rejects wrong units and untrusted source URLs', () => {
    expect(
      radiationSchema.safeParse({ units: { absorbedDoseRate: 'µSv/h' } })
        .success,
    ).toBe(false)
    expect(
      weatherSchema.safeParse({
        events: [],
        sources: [
          {
            source: 'NASA',
            sourceUrl: 'https://evil.example',
            fetchedAt: '2026-11-14T12:00:00Z',
            cached: false,
            historical: true,
            simulated: false,
          },
        ],
      }).success,
    ).toBe(false)
  })
})
