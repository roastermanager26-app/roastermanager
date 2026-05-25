import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ParentDashboardClient from './parent-dashboard-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ParentDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 1. Obtener el perfil para verificar rol e is_parent
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 2. Redirigir a cambio de contraseña si force_password_change es true
    if (profile?.force_password_change) {
        // Redirigimos al perfil donde estará el formulario de cambio obligatorio
        redirect('/dashboard/parent/profile?force_reset=true')
    }

    // 3. Obtener los hijos vinculados
    const { data: linkages } = await supabase
        .from('player_parents')
        .select('player_id')
        .eq('parent_profile_id', user.id)

    const childIds = linkages?.map((l: any) => l.player_id) || []

    // 4. Obtener datos de los hijos si existen
    let childrenData: any[] = []
    if (childIds.length > 0) {
        // Obtenemos los jugadores y sus relaciones base
        const { data: players, error: playerError } = await supabase
            .from('players')
            .select(`
                *,
                skills (
                    *
                ),
                event_attendance (
                    *,
                    events:event_id(status, event_type)
                )
            `)
            .in('id', childIds)

        const { data: messages } = await supabase
            .from('player_messages')
            .select('*')
            .in('player_id', childIds)

        childrenData = players || []
        
        if (messages && childrenData.length > 0) {
            childrenData = childrenData.map((player: any) => ({
                ...player,
                player_messages: messages.filter((m: any) => m.player_id === player.id)
            }))
        }
    }

    // 5. Obtener comunicados públicos
    const { data: billboardPosts } = await supabase
        .from('billboard_posts')
        .select('*')
        .eq('category', 'publico')
        .order('created_at', { ascending: false })
        .limit(3)

    let tenantName = 'RoasterManager'
    if (profile?.tenant_id) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', profile.tenant_id)
            .single()
        if (tenant) {
            tenantName = tenant.name
        }
    }

    return (
        <ParentDashboardClient
            profile={profile}
            childrenData={childrenData}
            billboardPosts={billboardPosts || []}
            tenantName={tenantName}
        />
    )
}

