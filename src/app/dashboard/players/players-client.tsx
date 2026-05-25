'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLang } from '@/components/lang-provider'
import { Search, UserPlus, FileUp, Filter, LayoutGrid, List as ListIcon, CheckSquare, Shield, Activity, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

const FORWARDS_POSITIONS = ["Pilar", "Hooker", "Segunda línea", "Ala", "Octavo"]
const BACKS_POSITIONS = ["Medio Scrum", "Apertura", "Primer Centro", "Segundo Centro", "Wing", "Full Back"]

const SKILL_KEYS = [
    'passing_receiving', 'ruck', 'tackle', 'contact', 'speed', 'endurance',
    'strength', 'tactical_positioning', 'decision_making', 'line_out',
    'scrum', 'attack', 'defense', 'mentality', 'kicking', 'duel'
]

type Player = {
    id: string
    first_name: string
    last_name: string
    position: string
    category: 'Forwards' | 'Backs' | null
    age: number | null
    status: 'Activo' | 'Suspendido' | 'Lesionado' | 'Abandonado' | null
    image_url?: string
    skills?: any[]
}

export default function PlayersClient({ 
    initialPlayers,
    tenantName = 'RoasterManager',
    categoryName = 'Todas las Categorías'
}: { 
    initialPlayers: Player[]
    tenantName?: string
    categoryName?: string
}) {
    const { t } = useLang()
    const router = useRouter()
    const supabase = createClient()

    const [players, setPlayers] = useState<Player[]>(initialPlayers)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState<'All' | 'Forwards' | 'Backs'>('All')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        setPlayers(initialPlayers)
    }, [initialPlayers])

    const filteredPlayers = players.filter(player => {
        const matchesSearch = `${player.first_name} ${player.last_name}`.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = filterCategory === 'All' || player.category === filterCategory
        return matchesSearch && matchesCategory
    })

    const handleUpdatePlayer = async (id: string, field: keyof Player, value: any) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === id) {
                if (field === 'category') return { ...p, category: value, position: '' }
                return { ...p, [field]: value }
            }
            return p
        }))

        const updateData: any = { [field]: value }
        if (field === 'category') updateData.position = null

        const { error } = await supabase.from('players').update(updateData).eq('id', id)
        if (error) {
            console.error(error)
            router.refresh()
        }
    }

    const handleBulkUpdate = async (field: keyof Player, value: any) => {
        if (selectedIds.length === 0) return
        setIsUpdating(true)

        const updateData: any = { [field]: value }
        if (field === 'category') updateData.position = null

        const { error } = await supabase.from('players').update(updateData).in('id', selectedIds)
        if (!error) {
            setPlayers(prev => prev.map(p => {
                if (selectedIds.includes(p.id)) {
                    if (field === 'category') return { ...p, category: value, position: '' }
                    return { ...p, [field]: value }
                }
                return p
            }))
            setSelectedIds([])
        } else {
            console.error(error)
        }
        setIsUpdating(false)
        router.refresh()
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredPlayers.length && filteredPlayers.length > 0) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredPlayers.map(p => p.id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const forwards = players.filter(p => p.category === 'Forwards')
    const backs = players.filter(p => p.category === 'Backs')

    const getStats = (list: Player[]) => ({
        total: list.length,
        activos: list.filter(p => p.status === 'Activo').length,
        suspendidos: list.filter(p => p.status === 'Suspendido').length,
        lesionados: list.filter(p => p.status === 'Lesionado').length,
        abandonados: list.filter(p => p.status === 'Abandonado').length
    })

    const fwStats = getStats(forwards)
    const bkStats = getStats(backs)

    const getPlayerRatingContext = (skills?: any[]) => {
        if (!skills || skills.length === 0) return { rating: 0, trend: 'equal', colorClass: 'text-gray-400 bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10' }

        const sortedSkills = [...skills].sort((a, b) => new Date(b.date_logged || 0).getTime() - new Date(a.date_logged || 0).getTime())

        const calcScore = (s: any) => {
            let sum = 0
            SKILL_KEYS.forEach(k => sum += (s[k] || 1)) // defaulting to 1 if not set
            const max = SKILL_KEYS.length * 5
            return Math.round((sum / max) * 100)
        }

        const currentScore = calcScore(sortedSkills[0])
        const prevScore = sortedSkills.length > 1 ? calcScore(sortedSkills[1]) : currentScore

        let trend = 'equal'
        if (currentScore > prevScore) trend = 'up'
        else if (currentScore < prevScore) trend = 'down'

        let colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
        if (currentScore < 40) colorClass = 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
        else if (currentScore < 70) colorClass = 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'

        return { rating: currentScore, trend, colorClass }
    }

    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/30 via-background to-background dark:from-liceo-primary/20 dark:via-background dark:to-background text-foreground transition-colors space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-liceo-primary to-liceo-accent dark:from-white dark:to-liceo-accent mb-2">
                        {t.roster.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Directorio de Jugadores — {categoryName} • {tenantName}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/add/import"
                        className="bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-2 transition-all font-bold text-sm text-gray-700 dark:text-gray-300"
                    >
                        <FileUp className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.roster.importBtn}</span>
                    </Link>
                    <Link
                        href="/dashboard/add"
                        className="bg-liceo-primary hover:bg-liceo-primary/90 dark:bg-liceo-gold dark:hover:bg-yellow-400 rounded-xl px-4 py-2.5 shadow-lg dark:shadow-[0_4px_20px_rgba(255,217,0,0.3)] flex items-center gap-2 transition-all font-bold text-sm text-white dark:text-[#0B1526]"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.roster.addPlayerBtn}</span>
                    </Link>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Forwards Card */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-liceo-primary dark:text-liceo-gold" />
                            Forwards
                        </h3>
                        <span className="bg-liceo-primary/10 text-liceo-primary dark:bg-liceo-gold/10 dark:text-liceo-gold font-bold px-3 py-1 rounded-full text-sm">
                            {fwStats.total} Total
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Activos</p>
                            <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">{fwStats.activos}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Lesionados</p>
                            <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300">{fwStats.lesionados}</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Suspendidos</p>
                            <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">{fwStats.suspendidos}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Inactivos</p>
                            <p className="text-lg sm:text-xl font-black text-gray-600 dark:text-gray-400">{fwStats.abandonados}</p>
                        </div>
                    </div>
                </div>

                {/* Backs Card */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-liceo-accent" />
                            Backs
                        </h3>
                        <span className="bg-liceo-accent/10 text-liceo-accent font-bold px-3 py-1 rounded-full text-sm">
                            {bkStats.total} Total
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Activos</p>
                            <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">{bkStats.activos}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Lesionados</p>
                            <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300">{bkStats.lesionados}</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Suspendidos</p>
                            <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">{bkStats.suspendidos}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 sm:p-2 text-center">
                            <p className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-tight sm:tracking-wider mb-1 truncate">Inactivos</p>
                            <p className="text-lg sm:text-xl font-black text-gray-600 dark:text-gray-400">{bkStats.abandonados}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-md">

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t.roster.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B1526]/50 focus:outline-none focus:ring-2 focus:ring-liceo-accent transition-all text-sm font-medium text-gray-900 dark:text-white"
                    />
                </div>

                {/* Category Filters */}
                <div className="flex bg-gray-100 dark:bg-[#0B1526]/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                    {(['All', 'Forwards', 'Backs'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterCategory === cat
                                ? 'bg-white dark:bg-white/10 shadow-sm text-liceo-primary dark:text-liceo-gold'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            {cat === 'All' ? t.roster.filterAll : cat === 'Forwards' ? t.roster.filterForwards : t.roster.filterBacks}
                        </button>
                    ))}
                </div>

                {/* View Mode Toggle */}
                <div className="hidden md:flex bg-gray-100 dark:bg-[#0B1526]/50 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm text-liceo-primary dark:text-liceo-gold' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-liceo-primary dark:text-liceo-gold' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Player Grid / List */}
            {filteredPlayers.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-70">
                    <Filter className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{t.roster.listEmpty}</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                    {filteredPlayers.map(player => (
                        <Link href={`/dashboard/players/${player.id}`} key={player.id} className="group cursor-pointer">
                            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-lg hover:shadow-xl dark:shadow-none hover:border-liceo-accent/50 dark:hover:bg-white/10 transition-all flex flex-col h-full relative overflow-hidden">

                                {/* Status badge */}
                                {player.status && (
                                    <div className="flex items-center gap-1.5 mt-2 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md max-w-max absolute top-4 right-4 z-10 shadow-sm">
                                        <div className={`w-2 h-2 rounded-full ${player.status === 'Activo' ? 'bg-emerald-500' :
                                            player.status === 'Lesionado' ? 'bg-rose-500' :
                                                player.status === 'Abandonado' ? 'bg-gray-500' :
                                                    'bg-amber-500'
                                            }`} />
                                        <span className="text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-widest">{player.status}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-liceo-primary to-liceo-accent shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform overflow-hidden relative">
                                        {player.image_url ? (
                                            <img src={player.image_url} alt={player.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <>{player.first_name.charAt(0)}{player.last_name.charAt(0)}</>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-extrabold text-gray-900 dark:text-white group-hover:text-liceo-primary dark:group-hover:text-liceo-gold transition-colors line-clamp-1">
                                            {player.first_name} {player.last_name}
                                        </h3>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{player.category || 'N/A'}</p>

                                        {(() => {
                                            const { rating, trend, colorClass } = getPlayerRatingContext(player.skills)
                                            return (
                                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${colorClass} text-xs font-black shadow-sm`}>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">OVR</span>
                                                    {rating}
                                                    {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div className="bg-gray-50 dark:bg-[#0B1526]/50 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">{t.roster.columns.position}</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{player.position ? player.position.split(',')[0] : '-'}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#0B1526]/50 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">{t.roster.columns.age}</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{player.age ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">

                    {/* Bulk Actions Bar */}
                    {selectedIds.length > 0 && viewMode === 'list' && (
                        <div className="bg-liceo-primary/10 dark:bg-liceo-gold/10 border border-liceo-primary/30 dark:border-liceo-gold/30 rounded-2xl p-3 md:px-5 flex flex-col md:flex-row md:items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                            <span className="text-sm font-extrabold text-liceo-primary dark:text-liceo-gold flex items-center gap-2">
                                <CheckSquare className="w-5 h-5" />
                                {selectedIds.length} Seleccionados
                            </span>

                            <div className="hidden md:block h-5 w-px bg-liceo-primary/20 dark:bg-liceo-gold/20" />

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:block">A Categoría:</span>
                                <div className="flex bg-white dark:bg-[#0B1526]/80 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-0.5">
                                    <button onClick={() => handleBulkUpdate('category', 'Forwards')} disabled={isUpdating} className="text-xs px-3 py-1.5 rounded-md font-bold transition-colors hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300">Forwards</button>
                                    <button onClick={() => handleBulkUpdate('category', 'Backs')} disabled={isUpdating} className="text-xs px-3 py-1.5 rounded-md font-bold transition-colors hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300">Backs</button>
                                </div>
                            </div>

                            <div className="hidden md:block h-5 w-px bg-liceo-primary/20 dark:bg-liceo-gold/20" />

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:block">A Estado:</span>
                                <div className="flex gap-1.5">
                                    <button onClick={() => handleBulkUpdate('status', 'Activo')} disabled={isUpdating} className="text-[11px] uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors">Activo</button>
                                    <button onClick={() => handleBulkUpdate('status', 'Lesionado')} disabled={isUpdating} className="text-[11px] uppercase tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors">Lesionado</button>
                                    <button onClick={() => handleBulkUpdate('status', 'Suspendido')} disabled={isUpdating} className="text-[11px] uppercase tracking-wider text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors">Suspendido</button>
                                    <button onClick={() => handleBulkUpdate('status', 'Abandonado')} disabled={isUpdating} className="text-[11px] uppercase tracking-wider text-gray-700 bg-gray-50 hover:bg-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:hover:bg-gray-500/20 border border-gray-300 dark:border-gray-500/30 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors">Abandonado</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg pb-4">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#001224]/50">
                                        <th className="pl-6 pr-2 py-4 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredPlayers.length && filteredPlayers.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 text-liceo-primary focus:ring-liceo-primary dark:bg-white/10 dark:border-white/20 dark:checked:bg-liceo-gold cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">{t.roster.columns.name}</th>
                                        <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24 text-center">OVR</th>
                                        <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">Categoría</th>
                                        <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">{t.roster.columns.position}</th>
                                        <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Edad</th>
                                        <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">{t.roster.columns.status}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.map(player => (
                                        <tr key={player.id} className={`border-b border-gray-100 dark:border-white/5 transition-colors group ${selectedIds.includes(player.id) ? 'bg-liceo-primary/5 dark:bg-liceo-gold/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                            <td className="pl-6 pr-2 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(player.id)}
                                                    onChange={() => toggleSelect(player.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-liceo-primary focus:ring-liceo-primary dark:bg-white/10 dark:border-white/20 dark:checked:bg-liceo-gold cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/dashboard/players/${player.id}`} className="flex items-center gap-3 w-fit">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-liceo-primary to-liceo-accent shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                                                        {player.image_url ? (
                                                            <img src={player.image_url} alt={player.first_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <>{player.first_name.charAt(0)}{player.last_name.charAt(0)}</>
                                                        )}
                                                    </div>
                                                    <span className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-liceo-primary dark:group-hover:text-liceo-gold transition-colors">
                                                        {player.first_name} {player.last_name}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {(() => {
                                                    const { rating, trend, colorClass } = getPlayerRatingContext(player.skills)
                                                    return (
                                                        <div className={`inline-flex items-center justify-center gap-1 min-w-[50px] px-2 py-1 rounded-full border ${colorClass} text-xs font-black`}>
                                                            {rating}
                                                            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={player.category || ''}
                                                    onChange={(e) => handleUpdatePlayer(player.id, 'category', e.target.value || null)}
                                                    disabled={player.status === 'Abandonado'}
                                                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-liceo-accent outline-none w-full max-w-[130px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">-</option>
                                                    <option value="Forwards">Forwards</option>
                                                    <option value="Backs">Backs</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={player.position ? player.position.split(', ')[0] : ''}
                                                    onChange={(e) => {
                                                        const newPos = e.target.value
                                                        if (!newPos) {
                                                            handleUpdatePlayer(player.id, 'position', '')
                                                        } else {
                                                            // We just replace the primary position for simplicity via list view
                                                            handleUpdatePlayer(player.id, 'position', newPos)
                                                        }
                                                    }}
                                                    disabled={!player.category || player.status === 'Abandonado'}
                                                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-2 text-sm font-semibold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-liceo-accent outline-none w-full max-w-[150px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">-</option>
                                                    {player.category === 'Forwards' && FORWARDS_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                                    {player.category === 'Backs' && BACKS_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                {player.age ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={player.status || ''}
                                                    onChange={(e) => handleUpdatePlayer(player.id, 'status', e.target.value)}
                                                    className={`bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/10 rounded-md py-1 px-1.5 text-[11px] font-bold uppercase tracking-widest outline-none transition-colors cursor-pointer w-full max-w-[120px] ${player.status === 'Activo' ? 'text-emerald-600 dark:text-emerald-400' :
                                                        player.status === 'Lesionado' ? 'text-rose-600 dark:text-rose-400' :
                                                            player.status === 'Abandonado' ? 'text-gray-500 dark:text-gray-400' :
                                                                'text-amber-600 dark:text-amber-400'
                                                        }`}
                                                >
                                                    <option className="text-black dark:text-white" value="Activo">Activo</option>
                                                    <option className="text-black dark:text-white" value="Suspendido">Suspendido</option>
                                                    <option className="text-black dark:text-white" value="Lesionado">Lesionado</option>
                                                    <option className="text-black dark:text-white" value="Abandonado">Abandonado</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
