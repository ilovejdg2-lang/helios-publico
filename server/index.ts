import { serve } from '@hono/node-server'
import { createApp } from './app'
import { loadEnv } from './env'

loadEnv()
const port = Number(process.env.PORT ?? 8787)
const hostname = '127.0.0.1'

serve({ fetch: createApp().fetch, port, hostname }, (info) => {
  console.log(`HELIOS API escuchando en http://${info.address}:${info.port}`)
})
