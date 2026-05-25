'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// We need a Service Role client to bypass RLS and create Tenants
function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_SECRET!
    )
}

export async function registerNewClub(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const clubName = formData.get('clubName') as string
    const logoUrl = formData.get('logoUrl') as string

    if (!email || !password || !fullName || !clubName) {
        return { error: 'Por favor completa todos los campos requeridos.' }
    }

    try {
        const supabase = await createClient()

        // 1. Sign up the user in Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'Admin'
                }
            }
        })

        if (authError) {
            console.error('Auth Error:', authError)
            return { error: authError.message }
        }

        const user = authData.user
        if (!user) {
            return { error: 'Error inesperado al crear el usuario.' }
        }

        // Wait a bit to ensure the Postgres trigger creates the profile
        await new Promise(resolve => setTimeout(resolve, 1000))

        const adminClient = createAdminClient()

        const subscriptionPlan = (formData.get('subscriptionPlan') as string) || 'Free'
        const maxUsers = subscriptionPlan === 'Basic' ? 20 : subscriptionPlan === 'Premium' ? 100 : 15
        const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        // 2. Create the Tenant
        const { data: tenant, error: tenantError } = await adminClient
            .from('tenants')
            .insert({
                name: clubName,
                logo_url: logoUrl || null,
                subscription_tier: subscriptionPlan,
                subscription_status: 'active',
                trial_ends_at: trialEndsAt,
                max_users: maxUsers,
                is_active: true
            })
            .select()
            .single()

        if (tenantError || !tenant) {
            console.error('Tenant Error:', tenantError)
            // Rollback is complex here without a stored procedure, but at least we report it
            return { error: 'No se pudo registrar el club en la base de datos.' }
        }

        // 3. Update the profile with tenant_id and role Admin
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({
                tenant_id: tenant.id,
                role: 'Admin'
            })
            .eq('id', user.id)

        if (profileError) {
            console.error('Profile Update Error:', profileError)
            return { error: 'Club creado, pero hubo un error al asociar tu perfil. Contacta soporte.' }
        }

        // Return success, the client will redirect
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected exception:', e)
        return { error: e.message || 'Ocurrió un error inesperado.' }
    }
}
