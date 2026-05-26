import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import TeamsClient from './teams-client'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
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

    let teamsQuery = supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })

    let playersQuery = supabase
        .from('players')
        .select('id, first_name, last_name, position, category_id, category')
        .neq('status', 'Abandonado')

    if (selectedCategoryId !== 'All') {
        teamsQuery = teamsQuery.eq('category_id', selectedCategoryId)
        playersQuery = playersQuery.eq('category_id', selectedCategoryId)
    }

    const { data: teams } = await teamsQuery
    const { data: players } = await playersQuery

    return <TeamsClient initialTeams={teams || []} allPlayers={players || []} />
}

