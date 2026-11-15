import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import { App } from './App'
import { LocaleProvider } from './i18n'
import './index.css'
import { hardenDomAgainstExternalMutations } from './domHarden'

hardenDomAgainstExternalMutations()

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')
createRoot(root).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
)

if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

void import('./platform/offlineQueue').then(({ startOfflineQueueListener }) => {
  startOfflineQueueListener()
})
