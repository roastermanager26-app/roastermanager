import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import MatchesClient from './matches-client'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, category_id')
        .eq('id', user.id)
        .single()

    const staffRoles = ['Admin', 'Manager', 'Staff', 'Administrador', 'Entrenador', 'Preparador Físico']
    const isStaff = staffRoles.includes(profile?.role || '')

    if (!isStaff) {
        redirect('/dashboard/parent')
    }

    const cookieStore = await cookies()
    let selectedCategoryId = cookieStore.get('roaster_selected_category_id')?.value || 'All'

    if (profile?.category_id) {
        selectedCategoryId = profile.category_id
    }

    let eventsQuery = supabase
        .from('events')
        .select('*, clubs(*)')
        .eq('event_type', 'Partido')
        .order('event_date', { ascending: false })

    let teamsQuery = supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })

    if (selectedCategoryId !== 'All') {
        eventsQuery = eventsQuery.eq('category_id', selectedCategoryId)
        teamsQuery = teamsQuery.eq('category_id', selectedCategoryId)
    }

    const { data: events, error: evErr } = await eventsQuery

    const { data: clubs, error: clErr } = await supabase
        .from('clubs')
        .select('*')
        .order('name', { ascending: true })

    const { data: teams, error: tErr } = await teamsQuery

    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

    const safeEvents = evErr ? [] : events
    const safeClubs = clErr ? [] : clubs
    const safeProfiles = profErr ? [] : profiles
    const safeTeams = tErr ? [] : teams
    const needsSetup = !!(evErr && evErr.code !== '42703') // 42703 is column missing (usually event_type missing). If table missing it's different.

    return <MatchesClient
        initialEvents={safeEvents || []}
        initialClubs={safeClubs || []}
        coaches={safeProfiles || []}
        teams={safeTeams || []}
        needsSetup={needsSetup}
    />
}

