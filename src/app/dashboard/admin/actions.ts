'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { uploadExternalLogoToBucket } from '@/utils/logo-uploader'

// Helper to create an admin client with service role key to bypass limits/RLS securely
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_SECRET

    if (!url || !serviceRoleKey) {
        throw new Error('Supabase URL or Service Role Secret is missing in env variables')
    }

    return createSupabaseClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Check if current user is admin and return their profile details
async function getAdminSession() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
        throw new Error('Usuario no autenticado')
    }

    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (profError || !profile) {
        throw new Error('No se pudo encontrar el perfil de usuario')
    }

    const isAdmin = ['Admin', 'Administrador'].includes(profile.role)
    if (!isAdmin) {
        throw new Error('No tenés permisos de Administrador para realizar esta acción')
    }

    return { user, profile }
}

// 1. Create a Category
export async function createClubCategory(name: string, description?: string) {
    try {
        const { profile } = await getAdminSession()
        const supabase = await createClient()

        if (!name || name.trim() === '') {
            return { error: 'El nombre de la categoría es requerido' }
        }

        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                tenant_id: profile.tenant_id
            })
            .select()
            .single()

        if (error) {
            return { error: error.message }
        }

        revalidatePath('/dashboard/admin')
        return { success: true, category: data }
    } catch (e: any) {
        return { error: e.message || 'Error inesperado al crear la categoría' }
    }
}

// 2. Register/Create a User
export async function createClubUser(data: {
    email: string
    password?: string
    full_name: string
    role: string
    phone?: string
    is_parent: boolean
    category_id?: string | null
    selectedChildren?: string[]
}) {
    try {
        const { profile: adminProfile } = await getAdminSession()
        const supabase = await createClient()

        if (!data.email || !data.full_name || !data.role) {
            return { error: 'Email, nombre y rol son campos obligatorios' }
        }

        const passwordToUse = data.password || 'Roaster@2026'

        // Create Auth User
        const adminClient = getAdminClient()
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: data.email.trim(),
            password: passwordToUse,
            email_confirm: true,
            user_metadata: { full_name: data.full_name.trim() }
        })

        if (authError) {
            return { error: 'Error en Supabase Auth: ' + authError.message }
        }

        const newUserId = authData.user?.id
        if (!newUserId) {
            return { error: 'No se pudo generar el identificador del usuario' }
        }

        // Insert or Upsert into profiles (since trigger might already create it)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: newUserId,
                tenant_id: adminProfile.tenant_id,
                category_id: data.category_id || null,
                full_name: data.full_name.trim(),
                role: data.role,
                phone: data.phone?.trim() || null,
                is_parent: data.is_parent,
                is_active: true,
                force_password_change: true
            }, { onConflict: 'id' })

        if (profileError) {
            // Rollback auth user
            await adminClient.auth.admin.deleteUser(newUserId)
            return { error: 'Error al registrar el perfil: ' + profileError.message }
        }

        // Link child players if user is parent
        if (data.is_parent && data.selectedChildren && data.selectedChildren.length > 0) {
            const childLinks = data.selectedChildren.map(playerId => ({
                parent_id: newUserId,
                player_id: playerId,
                tenant_id: adminProfile.tenant_id
            }))

            const { error: linkError } = await supabase
                .from('player_parents')
                .insert(childLinks)

            if (linkError) {
                console.error('Error linking children:', linkError.message)
            }
        }

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (e: any) {
        return { error: e.message || 'Error inesperado al registrar el usuario' }
    }
}

// Update User details
export async function updateClubUser(data: {
    id: string
    full_name: string
    role: string
    phone?: string
    is_active: boolean
    is_parent: boolean
    category_id?: string | null
    selectedChildren?: string[]
}) {
    try {
        const { profile: adminProfile } = await getAdminSession()
        const supabase = await createClient()

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: data.full_name.trim(),
                role: data.role,
                phone: data.phone?.trim() || null,
                is_active: data.is_active,
                is_parent: data.is_parent,
                category_id: data.category_id || null
            })
            .eq('id', data.id)
            .eq('tenant_id', adminProfile.tenant_id) // ensure they belong to same tenant

        if (profileError) {
            return { error: profileError.message }
        }

        // Update child linkages if applicable
        if (data.is_parent) {
            // Remove existing
            await supabase
                .from('player_parents')
                .delete()
                .eq('parent_id', data.id)

            // Insert new
            if (data.selectedChildren && data.selectedChildren.length > 0) {
                const childLinks = data.selectedChildren.map(playerId => ({
                    parent_id: data.id,
                    player_id: playerId,
                    tenant_id: adminProfile.tenant_id
                }))

                await supabase
                    .from('player_parents')
                    .insert(childLinks)
            }
        }

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (e: any) {
        return { error: e.message || 'Error inesperado al actualizar el usuario' }
    }
}

// Delete User
export async function deleteClubUser(userId: string) {
    try {
        const { profile: adminProfile } = await getAdminSession()
        const supabase = await createClient()

        if (userId === adminProfile.id) {
            return { error: 'No podés eliminar tu propia cuenta' }
        }

        // Delete from Auth first via admin client
        const adminClient = getAdminClient()
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

        // Profiles RLS and cascades usually delete but let's delete profiles manually too
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
            .eq('tenant_id', adminProfile.tenant_id)

        if (profileError) {
            return { error: profileError.message }
        }

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (e: any) {
        return { error: e.message || 'Error inesperado al eliminar el usuario' }
    }
}

// 3. Update Club Metadata
export async function updateClubMetadata(name: string, logoUrl?: string) {
    try {
        const { profile } = await getAdminSession()
        const supabase = await createClient()

        if (!name || name.trim() === '') {
            return { error: 'El nombre de la institución es obligatorio' }
        }

        let finalLogoUrl = logoUrl?.trim() || null
        if (finalLogoUrl && profile.tenant_id) {
            const bucketLogoUrl = await uploadExternalLogoToBucket(finalLogoUrl, profile.tenant_id)
            if (bucketLogoUrl) {
                finalLogoUrl = bucketLogoUrl
            }
        }

        const { error } = await supabase
            .from('tenants')
            .update({
                name: name.trim(),
                logo_url: finalLogoUrl
            })
            .eq('id', profile.tenant_id)

        if (error) {
            return { error: error.message }
        }

        revalidatePath('/dashboard/layout')
        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (e: any) {
        return { error: e.message || 'Error inesperado al actualizar los datos de la institución' }
    }
}

// 4. Fetch everything needed for Admin panel
export async function fetchClubData() {
    try {
        const { profile } = await getAdminSession()
        const supabase = await createClient()

        // Fetch categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .order('name', { ascending: true })

        // Fetch profiles under same tenant (users)
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('*, player_parents(player_id)')
            .eq('tenant_id', profile.tenant_id)
            .order('full_name', { ascending: true })

        // Fetch players under same tenant
        const { data: players, error: plError } = await supabase
            .from('players')
            .select('id, first_name, last_name, category_id, category')
            .neq('status', 'Abandonado')
            .order('first_name', { ascending: true })

        // Fetch current tenant metadata
        const { data: tenant, error: tenError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single()

        if (catError || userError || plError || tenError) {
            throw new Error(
                catError?.message || userError?.message || plError?.message || tenError?.message
            )
        }

        return {
            categories: categories || [],
            users: users || [],
            players: players || [],
            tenant
        }
    } catch (e: any) {
        throw new Error(e.message || 'Error al obtener los datos del club')
    }
}
