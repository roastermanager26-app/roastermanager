'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function updatePasswordAction(oldPassword: string, newPassword: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || !user.email) return { success: false, error: 'No autenticado.' }

    // 1. Verificar contraseña actual con un cliente sin persistencia
    const authClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN!, { auth: { persistSession: false } })
    const { error: verifyError } = await authClient.auth.signInWithPassword({ email: user.email, password: oldPassword })

    if (verifyError) {
        return { success: false, error: 'La contraseña actual no es correcta.' }
    }

    // 2. Cambiar password en Auth
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (updateError) return { success: false, error: updateError.message }

    // 3. Marcar que ya no requiere cambio en el perfil
    await supabase.from('profiles').update({
        force_password_change: false
    }).eq('id', user.id)

    revalidatePath('/dashboard/parent')
    return { success: true }
}
