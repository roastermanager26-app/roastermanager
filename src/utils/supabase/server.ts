import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN

    if (!url || !key) {
        // Durante el build, cookies() puede fallar o las variables no estar disponibles.
        // Retornamos un dummy para evitar que el proceso de compilación se detenga.
        return {
            auth: {},
            from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }) })
        } as any
    }

    const cookieStore = await cookies()

    return createServerClient(
        url,
        key,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }
                },
            },
        }
    )
}
