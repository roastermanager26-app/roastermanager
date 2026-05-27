import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from './calendar-client'

export const dynamic = 'force-dynamic'

export default async function ParentCalendarPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Obtener perfil para verificar is_parent (opcional pero recomendado)
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_parent, tenant_id')
        .eq('id', user.id)
        .single()

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

    // Obtener los hijos vinculados para filtrar por categoría
    const { data: linkages } = await supabase
        .from('player_parents')
        .select('player_id, players(category_id)')
        .eq('parent_profile_id', user.id)

    const childrenCategoryIds = Array.from(
        new Set(
            (linkages || [])
                .map((l: any) => l.players?.category_id)
                .filter(Boolean)
        )
    )

    // Fetch upcoming events from the next 60 days
    const today = new Date().toISOString()
    
    let eventsQuery = supabase
        .from('events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })

    if (childrenCategoryIds.length > 0) {
        eventsQuery = eventsQuery.or(`category_id.in.(${childrenCategoryIds.join(',')}),category_id.is.null`)
    } else {
        eventsQuery = eventsQuery.is('category_id', null)
    }

    const { data: events } = await eventsQuery

    return <CalendarClient initialEvents={events || []} tenantName={tenantName} />
}

