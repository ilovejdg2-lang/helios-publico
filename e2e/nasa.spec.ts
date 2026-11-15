import { expect, test } from '@playwright/test'

test('NASA environmental panels isolate data and expose missing quantities', async ({
  page,
}) => {
  await page.route('**/api/nasa/donki/events*', (route) =>
    route.fulfill({
      json: {
        events: [
          {
            id: 'fixture-flare',
            type: 'FLR',
            timestamp: '2024-05-10T00:10Z',
            beginTime: '2024-05-10T00:10Z',
            peakTime: '2024-05-10T00:13Z',
            endTime: '2024-05-10T00:22Z',
            classification: 'M1.3',
            description: 'NASA fixture for UI test',
            sourceUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/1/-1',
            instruments: ['GOES-P: EXIS 1.0-8.0'],
            linkedEvents: [],
          },
        ],
        sources: [
          {
            source: 'NASA DONKI · FLR',
            sourceUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR',
            fetchedAt: '2026-11-14T12:00:00.000Z',
            cached: true,
            historical: true,
            simulated: false,
            type: 'FLR',
          },
        ],
        failures: [],
      },
    }),
  )
  await page.goto('/app/alertas', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', {
      name: /Actividad espacial registrada por NASA|Space activity recorded by NASA/,
    }),
  ).toBeVisible()
  await expect(page.getByTestId('donki-alerts')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Ver detalles|View details/ }),
  ).toBeVisible()
  await expect(
    page.getByText(/Información de contexto espacial|Space-context information/),
  ).toBeVisible()

  await page.goto('/app/mision', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', { name: 'Space Weather Monitoring' }),
  ).toBeVisible()
  await expect(page.getByText('NASA fixture for UI test')).toBeVisible()
  await expect(
    page.getByText(/Preliminary DONKI|Información preliminar/),
  ).toBeVisible()
  await page.route('**/api/nasa/radlab/measurements*', (route) =>
    route.fulfill({
      json: {
        source: 'NASA RadLab',
        sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/api',
        fetchedAt: '2026-11-14T12:00:00Z',
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
      },
    }),
  )
  await page.route('**/api/nasa/osdr/studies/*', (route) =>
    route.fulfill({ status: 503, json: { message: 'offline' } }),
  )
  await page.goto('/app/riesgos', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', { name: 'Radiation Analysis' }),
  ).toBeVisible()
  await expect(
    page.getByText(
      /NASA did not supply this quantity|NASA no suministró esta magnitud/,
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Scientific Health Insights · OSDR' }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /OSDR unavailable|OSDR no disponible/ }),
  ).toHaveCount(2)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({ path: 'artifacts/nasa-mobile.png', fullPage: true })
})

test('DONKI outage is explicit and leaves simulator accessible', async ({
  page,
}) => {
  await page.route('**/api/nasa/donki/events*', (route) => route.abort())
  await page.goto('/app/mision', { waitUntil: 'domcontentloaded' })
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /NASA unavailable|NASA no disponible/ }),
  ).toBeVisible()
  await expect(page.getByTestId('sim-pill')).toBeVisible()
})

test('verified RadLab example works through the real Nest endpoint', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/nasa/radlab/example')
  expect(response.ok()).toBe(true)
  const data = await response.json()
  expect(data.example).toBe(true)
  expect(data.measurements).toHaveLength(13)
  expect(data.units).toEqual({
    absorbedDoseRate: '\u00b5Gy/h',
    doseEquivalentRate: '\u00b5Sv/h',
  })
  await page.route('**/api/nasa/radlab/measurements*', (route) =>
    route.fulfill({ status: 503, json: { message: 'NASA unavailable' } }),
  )
  await page.route('**/api/nasa/osdr/studies/*', (route) =>
    route.fulfill({ status: 503, json: { message: 'NASA unavailable' } }),
  )
  await page.goto('/app/riesgos', { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('button', {
      name: /Load verified local example|Cargar ejemplo local verificado/,
    })
    .click()
  await expect(
    page.getByText(
      /Verified local historical example|Ejemplo histórico local verificado/,
    ),
  ).toBeVisible()
  await expect(page.getByText('REM-Lid · ISS')).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: /Absorbed dose rate|Tasa de dosis absorbida/,
    }),
  ).toBeVisible()
})

test('all HELIOS pages render without JavaScript errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/api/nasa/donki/events*', (route) =>
    route.fulfill({ json: { events: [], sources: [] } }),
  )
  await page.route('**/api/nasa/radlab/measurements*', (route) =>
    route.fulfill({ status: 503, json: { message: 'offline' } }),
  )
  await page.route('**/api/nasa/osdr/studies/*', (route) =>
    route.fulfill({ status: 503, json: { message: 'offline' } }),
  )
  for (const path of [
    '',
    'mision',
    'tripulacion',
    'recursos',
    'alertas',
    'historial',
    'analisis',
    'riesgos',
    'medico',
    'mi-espacio',
  ]) {
    const target = path ? `/app/${path}` : '/app'
    const link = page.locator(`a[href="${target}"]`).first()
    if (path && await link.isVisible()) {
      await link.click()
      await expect(page).toHaveURL(new RegExp(`${target}$`))
    } else {
      await page.goto(target, { waitUntil: 'domcontentloaded' })
    }
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})
