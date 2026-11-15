import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const base = process.env.HELIOS_BASE || 'http://127.0.0.1:5175'
const out = join(process.cwd(), 'test-results', 'donki-alerts')
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
})
const context = await browser.newContext({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
  locale: 'es-CR',
})
const page = await context.newPage()

await page.goto(`${base}/entrar`, { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: 'ES', exact: true }).click()
await page.getByRole('button', { name: 'Explorar como jefe', exact: true }).click()
await page.waitForURL(/\/misiones/)
await page.getByRole('button', { name: 'Entrar al tablero', exact: true }).first().click()
await page.waitForURL(/\/app/)

await page.goto(`${base}/app/alertas`, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'light')
  localStorage.setItem('helios-theme', 'light')
})
await page.waitForSelector('[data-testid="donki-alerts"]', { timeout: 45000 })
await page.waitForSelector('.donki-card, .donki-empty, .donki-status-msg', {
  timeout: 60000,
})
await page.locator('[data-testid="donki-alerts"]').scrollIntoViewIfNeeded()
await page.waitForTimeout(2000)
await page.screenshot({
  path: join(out, 'donki-1440-light.png'),
  fullPage: true,
})

const detailBtn = page.getByRole('button', { name: /Ver detalles|View details/ }).first()
if (await detailBtn.count()) {
  await detailBtn.click()
  await page.waitForSelector('.donki-detail', { timeout: 10000 })
  await page.screenshot({ path: join(out, 'donki-detail-light.png') })
  await page.locator('[data-donki-close]').click()
}

await page.evaluate(() => {
  document.documentElement.setAttribute('data-theme', 'dark')
  localStorage.setItem('helios-theme', 'dark')
})
await page.waitForTimeout(400)
await page.locator('[data-testid="donki-alerts"]').scrollIntoViewIfNeeded()
await page.screenshot({
  path: join(out, 'donki-1440-dark.png'),
  fullPage: true,
})

for (const [name, width, height] of [
  ['768', 768, 1024],
  ['390', 390, 844],
  ['360', 360, 800],
]) {
  await page.setViewportSize({ width, height })
  await page.locator('[data-testid="donki-alerts"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: join(out, `donki-${name}.png`),
    fullPage: true,
  })
}

await browser.close()
console.log(`Screenshots written to ${out}`)
