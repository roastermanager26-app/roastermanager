import { fetchClubData } from './actions'
import AdminClient from './admin-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    try {
        const data = await fetchClubData()
        
        return (
            <AdminClient
                initialCategories={data.categories}
                initialUsers={data.users}
                initialPlayers={data.players}
                initialTenant={data.tenant}
            />
        )
    } catch (error: any) {
        console.error('Error fetching admin page data:', error)
        // If unauthorized or error, redirect back to staff dashboard
        redirect('/dashboard/staff')
    }
}
