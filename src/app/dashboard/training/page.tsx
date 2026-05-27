import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import TrainingClient from './training-client'

export const dynamic = 'force-dynamic'

export default async function TrainingPage() {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, category_id, tenant_id')
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

    // First attempt to fetch with event_type filter (new schema)
    let eventsQuery = supabase
        .from('events')
        .select('*')
        .eq('event_type', 'Entrenamiento')
        .order('event_date', { ascending: false })

    if (selectedCategoryId !== 'All') {
        eventsQuery = eventsQuery.eq('category_id', selectedCategoryId)
    }

    let { data: events, error: evErr } = await eventsQuery

    // If column missing (SQL not run yet), fallback to get all
    if (evErr && evErr.code === '42703') {
        let fallbackQuery = supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false })

        if (selectedCategoryId !== 'All') {
            fallbackQuery = fallbackQuery.eq('category_id', selectedCategoryId)
        }

        const fallback = await fallbackQuery
        events = fallback.data
        evErr = fallback.error
    }


    let drillsQuery = supabase
        .from('drills')
        .select('*')
        .order('name', { ascending: true })

    if (profile?.category_id) {
        drillsQuery = drillsQuery.or(`category_id.eq.${profile.category_id},category_id.is.null`)
    }

    const { data: drills, error: drErr } = await drillsQuery

    const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

    // If there is an error (like missing table), pass empty arrays to not break the app
    // We will handle the "Please run SQL" conditionally in the client
    const { data: attendanceData, error: attErr } = await supabase
        .from('event_attendance')
        .select('event_id, status')
        .eq('status', 'Presente')

    const attendanceCounts: Record<string, number> = {}
    if (attendanceData) {
        attendanceData.forEach((att: any) => {
            attendanceCounts[att.event_id] = (attendanceCounts[att.event_id] || 0) + 1
        })
    }

    // Fetch categories for the active tenant
    let categories: any[] = []
    if (profile?.tenant_id) {
        const { data: cats } = await supabase
            .from('categories')
            .select('id, name')
            .eq('tenant_id', profile.tenant_id)
            .order('name')
        categories = cats || []
    }

    const safeEvents = evErr ? [] : events
    const safeDrills = drErr ? [] : drills
    const safeProfiles = profErr ? [] : profiles
    const needsSetup = !!evErr

    return (
        <TrainingClient 
            initialEvents={safeEvents || []} 
            initialDrills={safeDrills || []} 
            coaches={safeProfiles || []} 
            needsSetup={needsSetup} 
            attendanceCounts={attendanceCounts} 
            categories={categories}
            userRole={profile?.role}
            currentCategoryId={profile?.category_id}
        />
    )
}
