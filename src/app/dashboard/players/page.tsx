import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import PlayersClient from './players-client'

export default async function PlayersPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // Check user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    const staffRoles = ['Admin', 'Manager', 'Staff', 'Administrador', 'Entrenador', 'Preparador Físico']
    const isStaff = staffRoles.includes(profile?.role || '')

    if (!isStaff) {
        redirect('/dashboard/parent')
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

    // Fetch players from supabase
    let playersQuery = supabase
        .from('players')
        .select('*, skills(*)')
        .order('first_name', { ascending: true })

    if (selectedCategoryId !== 'All') {
        playersQuery = playersQuery.eq('category_id', selectedCategoryId)
    }

    const { data: players } = await playersQuery

    return <PlayersClient 
        initialPlayers={players || []} 
        tenantName={tenantName} 
        categoryName={categoryName} 
    />
}

