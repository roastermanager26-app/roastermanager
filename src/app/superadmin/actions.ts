'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Admin client to bypass RLS and read system-wide tables
function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_SECRET!
    )
}

// Ensure the caller is really a Superadmin
async function checkSuperadminAuth() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Superadmin') {
        throw new Error('Permiso denegado. No eres Superadmin.')
    }
    return user
}

export async function fetchTenantsList() {
    await checkSuperadminAuth()
    const adminClient = getAdminClient()

    // Fetch all tenants
    const { data: tenants, error: tenantsError } = await adminClient
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    if (tenantsError) {
        console.error('Fetch tenants error:', tenantsError)
        return []
    }

    // For each tenant, fetch registered users count
    const tenantsWithMetrics = await Promise.all((tenants || []).map(async (tenant) => {
        const { count, error } = await adminClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

        // Fetch admin email if possible
        const { data: adminProfile } = await adminClient
            .from('profiles')
            .select('email, full_name')
            .eq('tenant_id', tenant.id)
            .eq('role', 'Admin')
            .limit(1)
            .single()

        return {
            ...tenant,
            userCount: count || 0,
            adminEmail: adminProfile?.email || 'N/A',
            adminName: adminProfile?.full_name || 'N/A'
        }
    }))

    return tenantsWithMetrics
}

export async function extendTenantTrial(tenantId: string) {
    await checkSuperadminAuth()
    const adminClient = getAdminClient()

    const newTrialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 more days

    const { error } = await adminClient
        .from('tenants')
        .update({
            trial_ends_at: newTrialEnd,
            subscription_status: 'active',
            is_active: true
        })
        .eq('id', tenantId)

    if (error) {
        console.error('Error extending trial:', error)
        return { error: 'No se pudo extender el período de prueba.' }
    }

    revalidatePath('/superadmin')
    return { success: true }
}

export async function updateTenantPlan(tenantId: string, plan: 'Free' | 'Basic' | 'Premium') {
    await checkSuperadminAuth()
    const adminClient = getAdminClient()

    const maxUsers = plan === 'Basic' ? 20 : plan === 'Premium' ? 100 : 15

    const { error } = await adminClient
        .from('tenants')
        .update({
            subscription_tier: plan,
            max_users: maxUsers
        })
        .eq('id', tenantId)

    if (error) {
        console.error('Error updating plan:', error)
        return { error: 'No se pudo actualizar el plan de suscripción.' }
    }

    revalidatePath('/superadmin')
    return { success: true }
}

export async function toggleTenantSuspension(tenantId: string, currentIsActive: boolean) {
    await checkSuperadminAuth()
    const adminClient = getAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({
            is_active: !currentIsActive,
            subscription_status: currentIsActive ? 'suspended' : 'active'
        })
        .eq('id', tenantId)

    if (error) {
        console.error('Error toggling suspension:', error)
        return { error: 'No se pudo cambiar el estado de suspensión.' }
    }

    revalidatePath('/superadmin')
    return { success: true }
}
