import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

let client: SupabaseClient | null = null

/** Cliente del navegador. Solo usa la publishable key; nunca la contraseña de la base. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export function supabaseConfigured(): boolean {
  return Boolean(url && key)
}

export function supabaseProjectHost(): string | null {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
  }
}
