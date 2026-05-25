import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN

  if (!url || !key) {
    if (typeof window === 'undefined') {
      // Retornar un objeto vacío durante el build para que no rompa el prerendering
      return {} as any
    }
    throw new Error('Supabase URL and Token are required in the client!')
  }

  return createBrowserClient(url, key)
}
