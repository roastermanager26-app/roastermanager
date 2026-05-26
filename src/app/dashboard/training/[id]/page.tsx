import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EventDetailClient from './event-detail-client'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const { id } = params
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

    const { data: event, error: evErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

    if (evErr || !event) {
        redirect('/dashboard/training')
    }

    // Get all drills to use in planning (restrcited to category or general)
    let drillsQuery = supabase.from('drills').select('*').order('name')
    if (profile?.category_id) {
        drillsQuery = drillsQuery.or(`category_id.eq.${profile.category_id},category_id.is.null`)
    }
    const { data: drills } = await drillsQuery

    // Get plan slots
    const { data: planSlots } = await supabase
        .from('event_plan_slots')
        .select('*, drills(*)')
        .eq('event_id', id)
        .order('order_index')

    // Get attendance records
    const { data: attendance } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', id)

    // Get notes
    const { data: notes } = await supabase
        .from('event_notes')
        .select('*, profiles(full_name, image_url)')
        .eq('event_id', id)
        .order('created_at', { ascending: false })

    // Get Players for attendance list (restricted to category)
    let playersQuery = supabase.from('players').select('*').neq('status', 'Abandonado').order('last_name')
    if (profile?.category_id) {
        playersQuery = playersQuery.eq('category_id', profile.category_id)
    }
    const { data: players } = await playersQuery

    // Get coaches
    const { data: coaches } = await supabase.from('profiles').select('*')

    // Get teams (restricted to category if present)
    let teamsQuery = supabase.from('teams').select('*').order('name')
    if (profile?.category_id) {
        teamsQuery = teamsQuery.eq('category_id', profile.category_id)
    }
    const { data: teams } = await teamsQuery

    return (
        <EventDetailClient
            event={event}
            drills={drills || []}
            initialSlots={planSlots || []}
            initialAttendance={attendance || []}
            initialNotes={notes || []}
            players={players || []}
            coaches={coaches || []}
            teams={teams || []}
            currentUser={user}
        />
    )
}
