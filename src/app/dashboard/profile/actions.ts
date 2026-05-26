'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function activateUserAction(formData: {
    mockId: string,
    email: string,
    role: string,
    password: string,
    full_name: string,
    phone: string,
    is_parent: boolean,
    category_id?: string | null,
    selectedChildren: string[]
}) {
    // Usamos el cliente de servidor para validar al admin que llama
    const supabase = await createClient()

    // 1. Validar que quien llama sea Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'Admin') return { error: 'No tenés permisos de Admin' }

    // 2. Crear el usuario en Auth
    let newAuthId: string | undefined;

    // Si tenemos la Service Role Key, usamos el cliente de admin para saltar Rate Limits
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_SECRET;
    if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
            user_metadata: { full_name: formData.full_name }
        });

        if (adminError) return { error: 'Admin Auth Error: ' + adminError.message };
        newAuthId = adminData.user?.id;
    } else {
        // Fallback al signUp normal si no hay Service Role Key
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.full_name,
                }
            }
        });

        if (authError) {
            if (authError.message.includes('rate limit')) {
                return { error: 'Límite de Supabase alcanzado. Por favor, asegurate que la SUPABASE_SERVICE_ROLE_SECRET esté en .env.local o esperá 1 minuto.' };
            }
            return { error: authError.message };
        }
        newAuthId = authData.user?.id;
    }

    if (!newAuthId) return { error: 'No se pudo generar el ID de usuario' };

    // 3. Crear o Actualizar el Perfil Real (Usamos upsert porque el trigger ya pudo haber creado la fila)
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: newAuthId,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        is_parent: formData.is_parent,
        category_id: formData.category_id || null,
        is_active: true,
        force_password_change: true
    }, { onConflict: 'id' })

    if (profileError) {
        // Si falla el perfil, intentamos limpiar el usuario de Auth para no dejar basura
        if (serviceRoleKey) {
            const adminClient = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey
            )
            await adminClient.auth.admin.deleteUser(newAuthId)
        }
        return { error: 'Error al vincular perfil: ' + profileError.message }
    }

    // 4. Vincular hijos
    if (formData.is_parent && formData.selectedChildren.length > 0) {
        const childLinks = formData.selectedChildren.map(pid => ({
            parent_profile_id: newAuthId,
            player_id: pid
        }))
        await supabase.from('player_parents').insert(childLinks)
    }

    // 5. Borrar el Mock
    await supabase.from('profiles').delete().eq('id', formData.mockId)

    revalidatePath('/dashboard/staff')
    return { success: true }
}

export async function updatePasswordAction(oldPassword: string, newPassword: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || !user.email) return { success: false, error: 'No autenticado.' }

    // Verificar contraseña actual con un cliente sin persistencia
    const authClient = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_TOKEN!, { auth: { persistSession: false } })
    const { error: verifyError } = await authClient.auth.signInWithPassword({ email: user.email, password: oldPassword })

    if (verifyError) {
        return { success: false, error: 'La contraseña actual no es correcta.' }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
        return { success: false, error: updateError.message }
    }

    // Limpiar flag the force_password_change
    await supabase.from('profiles').update({ force_password_change: false }).eq('id', user.id)
    return { success: true }
}

export async function updateUserAdminAction(formData: {
    userId: string,
    full_name: string,
    role: string,
    phone: string,
    is_parent: boolean,
    is_active: boolean,
    category_id?: string | null
}) {
    const supabase = await createClient()

    // 1. Validar que quien llama sea Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'Admin') return { error: 'No tenés permisos de Admin' }

    // 2. Actualizar el Perfil
    const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        is_parent: formData.is_parent,
        is_active: formData.is_active,
        category_id: formData.category_id || null
    }).eq('id', formData.userId)

    if (profileError) return { error: profileError.message }

    revalidatePath('/dashboard/staff')
    return { success: true }
}

export async function deleteUserAdminAction(userId: string) {
    const supabase = await createClient()

    // 1. Validar que quien llama sea Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'Admin') return { error: 'No tenés permisos de Admin' }

    // No permitir borrarse a sí mismo por error (opcional pero seguro)
    if (user.id === userId) return { error: 'No podés borrarte a vos mismo' }

    // 2. Borrar del perfil (Esto es simple si es Mock)
    // Si es real, el borrado de Auth requiere Service Role Key. 
    // Por ahora borramos el perfil. Si tiene Auth, quedará el "orphaned" user en Auth a menos que usemos adminClient.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_SECRET;
    if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        )
        // Intentar borrar de Auth primero
        await adminClient.auth.admin.deleteUser(userId)
    }

    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/staff')
    return { success: true }
}
