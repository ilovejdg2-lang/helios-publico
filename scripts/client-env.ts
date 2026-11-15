/** Runs only in the Vite configuration, never in the browser. */
export function assertPublicClientEnv(env: Record<string, string>) {
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('VITE_') || !value) continue
    if (
      /(PASSWORD|SECRET|SERVICE_ROLE|PRIVATE|AI_API_KEY|NASA_API_KEY|TOKEN)/i.test(
        name,
      ) ||
      /^(sb_secret_|sk-(?:proj-|ant-)?|sk_(?:live|test)_|gh[pousr]_|github_pat_)/.test(
        value,
      )
    ) {
      throw new Error(
        'Private credentials must be configured only in the backend.',
      )
    }
    const payload = value.split('.')[1]
    if (value.startsWith('eyJ') && payload) {
      let role: unknown
      try {
        role = (
          JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
            role?: unknown
          }
        ).role
      } catch {
        /* Not a JWT. */
      }
      if (role === 'service_role')
        throw new Error(
          'A Supabase service role credential cannot be used in the browser.',
        )
    }
  }
}
