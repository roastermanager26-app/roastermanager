'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
    fetchTenantsList, 
    extendTenantTrial, 
    updateTenantPlan, 
    toggleTenantSuspension 
} from './actions'
import { 
    Shield, 
    Building, 
    Users, 
    Calendar, 
    Activity, 
    Search, 
    Power, 
    Zap, 
    Trophy, 
    Sparkles, 
    Clock, 
    LogOut,
    Loader2,
    RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SuperadminDashboard() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [tenants, setTenants] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [filterPlan, setFilterPlan] = useState('All')
    const [filterStatus, setFilterStatus] = useState('All')

    const loadData = async () => {
        try {
            const data = await fetchTenantsList()
            setTenants(data)
        } catch (e: any) {
            toast.error(e.message || 'Error al cargar datos del sistema.')
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const verifySuperadmin = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'Superadmin') {
                toast.error('Acceso restringido. No tienes permisos de Superadmin.')
                router.push('/dashboard')
                return
            }

            await loadData()
        }

        verifySuperadmin()
    }, [router, supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleExtendTrial = async (tenantId: string, clubName: string) => {
        setActionLoading(tenantId + '-extend')
        const res = await extendTenantTrial(tenantId)
        if (res.success) {
            toast.success(`Prueba extendida por 30 días para ${clubName}`)
            await loadData()
        } else {
            toast.error(res.error || 'No se pudo extender la prueba.')
        }
        setActionLoading(null)
    }

    const handleCyclePlan = async (tenantId: string, currentPlan: 'Free' | 'Basic' | 'Premium', clubName: string) => {
        const plans: ('Free' | 'Basic' | 'Premium')[] = ['Free', 'Basic', 'Premium']
        const nextIdx = (plans.indexOf(currentPlan) + 1) % plans.length
        const nextPlan = plans[nextIdx]

        setActionLoading(tenantId + '-plan')
        const res = await updateTenantPlan(tenantId, nextPlan)
        if (res.success) {
            toast.success(`Plan actualizado a ${nextPlan} para ${clubName}`)
            await loadData()
        } else {
            toast.error(res.error || 'No se pudo actualizar el plan.')
        }
        setActionLoading(null)
    }

    const handleToggleSuspension = async (tenantId: string, isActive: boolean, clubName: string) => {
        setActionLoading(tenantId + '-suspend')
        const res = await toggleTenantSuspension(tenantId, isActive)
        if (res.success) {
            toast.success(isActive ? `${clubName} ha sido suspendido` : `${clubName} ha sido activado`)
            await loadData()
        } else {
            toast.error(res.error || 'No se pudo cambiar el estado de suspensión.')
        }
        setActionLoading(null)
    }

    // Filters and Search
    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                              t.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
                              t.adminName.toLowerCase().includes(search.toLowerCase())
        
        const matchesPlan = filterPlan === 'All' || t.subscription_tier === filterPlan

        const isExpired = new Date(t.trial_ends_at) < new Date()
        let status = t.is_active ? (isExpired ? 'Expired' : 'Active') : 'Suspended'
        
        const matchesStatus = filterStatus === 'All' || status === filterStatus

        return matchesSearch && matchesPlan && matchesStatus
    })

    // System Metrics
    const totalClubs = tenants.length
    const activeClubs = tenants.filter(t => t.is_active && new Date(t.trial_ends_at) >= new Date()).length
    const expiredClubs = tenants.filter(t => t.is_active && new Date(t.trial_ends_at) < new Date()).length
    const suspendedClubs = tenants.filter(t => !t.is_active).length
    const totalUsers = tenants.reduce((acc, t) => acc + t.userCount, 0)

    if (loading) {
        return (
            <div className="min-h-screen bg-[#040A14] flex flex-col items-center justify-center p-4 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-[#5EE5F8]" />
                <p className="text-xs text-gray-500 mt-4 font-bold tracking-widest uppercase">Cargando Panel Superadmin...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#040A14] text-white font-sans selection:bg-[#5EE5F8] selection:text-[#040A14] pb-16">
            {/* Header */}
            <header className="bg-[#0B1526]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-900/40 to-[#0B1526] flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <Shield className="w-5 h-5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Roaster<span className="text-[#5EE5F8]">Manager</span>
                            </span>
                            <span className="text-[9px] font-black tracking-widest text-red-400 uppercase">SUPERADMIN PANEL</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metric 1: Total Clubs */}
                    <div className="bg-[#0B1526]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex items-center gap-5 hover:border-white/10 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <Building className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{totalClubs}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clubes Totales</div>
                        </div>
                    </div>

                    {/* Metric 2: Active Clubs */}
                    <div className="bg-[#0B1526]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex items-center gap-5 hover:border-white/10 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-emerald-400">{activeClubs}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clubes Activos</div>
                        </div>
                    </div>

                    {/* Metric 3: Expired / Suspended */}
                    <div className="bg-[#0B1526]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex items-center gap-5 hover:border-white/10 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-red-400">{expiredClubs + suspendedClubs}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suspendidos / Expirados</div>
                        </div>
                    </div>

                    {/* Metric 4: Total Users */}
                    <div className="bg-[#0B1526]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex items-center gap-5 hover:border-white/10 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{totalUsers}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usuarios Globales</div>
                        </div>
                    </div>
                </div>

                {/* Filters Area */}
                <div className="bg-[#0B1526]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                        <input
                            type="text"
                            placeholder="Buscar club, administrador, correo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#111f38]/60 border border-white/5 rounded-xl text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EE5F8] focus:border-transparent transition-all text-white font-medium"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex flex-col gap-1 flex-1 md:flex-initial">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Plan</span>
                            <select
                                value={filterPlan}
                                onChange={(e) => setFilterPlan(e.target.value)}
                                className="bg-[#111f38]/60 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#5EE5F8]"
                            >
                                <option value="All">Todos</option>
                                <option value="Free">Free</option>
                                <option value="Basic">Basic</option>
                                <option value="Premium">Premium</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 flex-1 md:flex-initial">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Estado</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-[#111f38]/60 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#5EE5F8]"
                            >
                                <option value="All">Todos</option>
                                <option value="Active">Activo</option>
                                <option value="Expired">Expirado</option>
                                <option value="Suspended">Suspendido</option>
                            </select>
                        </div>

                        <button 
                            onClick={loadData}
                            className="bg-[#111f38] hover:bg-[#1a2d4d] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center self-end h-[38px] w-[38px]"
                            title="Recargar datos"
                        >
                            <RefreshCw className="w-4 h-4 text-[#5EE5F8]" />
                        </button>
                    </div>
                </div>

                {/* Tenants Table */}
                <div className="bg-[#0B1526]/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-[#111f38]/40 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                    <th className="px-6 py-4">Club / Institución</th>
                                    <th className="px-6 py-4">Admin Principal</th>
                                    <th className="px-6 py-4">Suscripción</th>
                                    <th className="px-6 py-4">Límite / Usuarios</th>
                                    <th className="px-6 py-4">Prueba Expiración</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones de Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map((t) => {
                                        const isExpired = new Date(t.trial_ends_at) < new Date()
                                        
                                        // Calculate status badge
                                        let statusBadge = (
                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                Activo
                                            </span>
                                        )
                                        if (!t.is_active) {
                                            statusBadge = (
                                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    Suspendido
                                                </span>
                                            )
                                        } else if (isExpired) {
                                            statusBadge = (
                                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    Expirado
                                                </span>
                                            )
                                        }

                                        // Subscription badge icon
                                        let planIcon = <Zap className="w-3.5 h-3.5 text-gray-400" />
                                        if (t.subscription_tier === 'Basic') planIcon = <Trophy className="w-3.5 h-3.5 text-blue-400" />
                                        if (t.subscription_tier === 'Premium') planIcon = <Sparkles className="w-3.5 h-3.5 text-[#5EE5F8]" />

                                        return (
                                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-5 font-bold flex items-center gap-3">
                                                    {t.logo_url ? (
                                                        <img src={t.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/5 p-1 border border-white/10" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-[#111f38] flex items-center justify-center font-black text-[#5EE5F8] border border-white/5">
                                                            {t.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-white">{t.name}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-white">{t.adminName}</div>
                                                    <div className="text-[10px] text-gray-400">{t.adminEmail}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button
                                                        onClick={() => handleCyclePlan(t.id, t.subscription_tier, t.name)}
                                                        disabled={actionLoading === t.id + '-plan'}
                                                        className="flex items-center gap-1.5 bg-[#111f38] hover:bg-[#1a2d4d] border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl font-bold transition-all text-[11px]"
                                                        title="Haga clic para cambiar de plan"
                                                    >
                                                        {actionLoading === t.id + '-plan' ? (
                                                            <Loader2 className="w-3 h-3 animate-spin text-[#5EE5F8]" />
                                                        ) : (
                                                            planIcon
                                                        )}
                                                        Plan {t.subscription_tier}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-5 font-medium">
                                                    <span className="text-white font-bold">{t.userCount}</span>
                                                    <span className="text-gray-500"> / {t.max_users}</span>
                                                </td>
                                                <td className="px-6 py-5 font-medium">
                                                    <div className="text-white font-semibold">
                                                        {new Date(t.trial_ends_at).toLocaleDateString('es-AR')}
                                                    </div>
                                                    <div className="text-[9px] text-gray-400">
                                                        {isExpired ? 'Expiró' : 'Expira'} hace/en {Math.ceil(Math.abs(new Date(t.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} días
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {statusBadge}
                                                </td>
                                                <td className="px-6 py-5 text-right space-x-2">
                                                    {/* Action: Extend Trial */}
                                                    <button
                                                        onClick={() => handleExtendTrial(t.id, t.name)}
                                                        disabled={actionLoading !== null}
                                                        className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 transition-all font-bold cursor-pointer"
                                                        title="Extender Prueba por 30 Días"
                                                    >
                                                        {actionLoading === t.id + '-extend' ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Clock className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    {/* Action: Suspend / Toggle */}
                                                    <button
                                                        onClick={() => handleToggleSuspension(t.id, t.is_active, t.name)}
                                                        disabled={actionLoading !== null}
                                                        className={`inline-flex items-center justify-center p-2 rounded-xl transition-all border font-bold cursor-pointer ${
                                                            t.is_active 
                                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30'
                                                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/30'
                                                        }`}
                                                        title={t.is_active ? 'Suspender Club' : 'Activar Club'}
                                                    >
                                                        {actionLoading === t.id + '-suspend' ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Power className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 font-bold uppercase tracking-wider">
                                            No se encontraron clubes registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
