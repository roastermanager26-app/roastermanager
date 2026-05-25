import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { isStaff } from '@/utils/roles'
import { cookies } from 'next/headers'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_parent, is_active, force_password_change, tenant_id')
        .eq('id', user.id)
        .single()

    if (profile?.force_password_change) {
        redirect('/dashboard/profile')
    }

    // Redirigir si es padre y NO tiene rol de staff
    if (profile?.is_parent && !isStaff(profile?.role)) {
        redirect('/dashboard/parent')
    }

    // Redirigir al dashboard si no es activo (opcional)
    if (profile && !profile.is_active) {
        redirect('/login?error=Cuenta inactiva')
    }

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

    const cookieStore = await cookies()
    const selectedCategoryId = cookieStore.get('roaster_selected_category_id')?.value || 'All'

    let categoryName = 'Todas las Categorías'
    if (selectedCategoryId !== 'All') {
        const { data: cat } = await supabase
            .from('categories')
            .select('name')
            .eq('id', selectedCategoryId)
            .single()
        if (cat) {
            categoryName = `Categoría ${cat.name}`
        }
    }

    let playersQuery = supabase.from('players').select('*, skills(*)').neq('status', 'Abandonado')
    let eventsQuery = supabase.from('events').select('*')

    if (selectedCategoryId !== 'All') {
        playersQuery = playersQuery.eq('category_id', selectedCategoryId)
        eventsQuery = eventsQuery.eq('category_id', selectedCategoryId)
    }

    const { data: players } = await playersQuery
    const { data: events } = await eventsQuery
    const { data: attendance } = await supabase.from('event_attendance').select('*')

    // Filter attendance to match only active category events
    const activeEventIds = (events || []).map((e: any) => e.id)
    const filteredAttendance = (attendance || []).filter((a: any) => activeEventIds.includes(a.event_id))

    const playersWithLatestSkills = (players || []).map((p: any) => {
        const sortedSkills = p.skills?.sort((a: any, b: any) => new Date(b.date_logged || 0).getTime() - new Date(a.date_logged || 0).getTime())
        return {
            ...p,
            skills: sortedSkills?.[0] || null,
            allSkills: sortedSkills || []
        }
    })

    return <DashboardClient 
        players={playersWithLatestSkills} 
        events={events || []} 
        attendance={filteredAttendance || []} 
        tenantName={tenantName} 
        categoryName={categoryName} 
    />
}

