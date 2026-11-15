import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const routes = [
  '/', '/proyecto', '/como-funciona', '/nosotros', '/nosotros/maria-del-mar-diaz-ruiz', '/video', '/documentos', '/datos',
  '/app', '/app/tripulacion', '/app/recursos', '/app/alertas', '/app/historial', '/app/analisis', '/app/medico', '/app/mision', '/app/riesgos', '/app/mi-espacio',
]
for (const theme of ['light', 'dark']) {
  test(`WCAG A/AA automated audit of routes in ${theme}`, async ({ page }, info) => {
    test.setTimeout(240000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((selected) => {
      localStorage.setItem('helios-theme', selected)
      localStorage.setItem('quiron-greet-dismissed', 'true')
    }, theme)
    await page.route('**/api/nasa/**', (route) => route.fulfill({ status: 503, json: { message: 'Fixture: unavailable' } }))
    const failures: { route: string; id: string; impact: string | null | undefined; elements: string[] }[] = []
    for (const route of routes) {
      const link = page.locator(`a[href="${route}"]`).first()
      if (route.startsWith('/app/') && new URL(page.url()).pathname.startsWith('/app') && await link.isVisible()) {
        await link.click()
        await expect(page).toHaveURL(new RegExp(`${route}$`))
      } else {
        await page.goto(route)
      }
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      for (const violation of result.violations) failures.push({
        route, id: violation.id, impact: violation.impact,
        elements: violation.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary}`),
      })
    }
    await info.attach(`accessibility-${theme}`, { body: JSON.stringify(failures, null, 2), contentType: 'application/json' })
    expect(failures).toEqual([])
  })
}
