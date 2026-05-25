'use client'

import { Users, TrendingUp, ShieldAlert, Award, ChevronRight, Activity, ActivitySquare, Cake } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/components/lang-provider'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useMemo } from 'react'

export default function DashboardClient({ 
    players, 
    events, 
    attendance, 
    tenantName = 'RoasterManager', 
    categoryName = 'Todas las Categorías' 
}: { 
    players: any[], 
    events: any[], 
    attendance: any[], 
    tenantName?: string, 
    categoryName?: string 
}) {
    const { t } = useLang()

    const activePlayers = useMemo(() => players.filter(p => p.status === 'Activo'), [players])
    const totalPlayers = activePlayers.length

    // Calculate Birthdays
    const upcomingBirthdays = useMemo(() => {
        const today = new Date()
        today.setHours(0,0,0,0)
        
        return activePlayers.map(p => {
            if (!p.birth_date) return null
            const [y, m, d] = p.birth_date.split('-')
            const birthMonth = parseInt(m) - 1
            const birthDay = parseInt(d)
            
            let bday = new Date(today.getFullYear(), birthMonth, birthDay, 0, 0, 0)
            
            // Si el cumpleaños de este año ya pasó, el próximo es el año que viene
            if (bday.getTime() < today.getTime()) {
                bday = new Date(today.getFullYear() + 1, birthMonth, birthDay, 0, 0, 0)
            }
            
            const diffDays = Math.round((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
            if (diffDays <= 15) {
                return { ...p, daysToBirthday: diffDays }
            }
            return null
        }).filter(Boolean).sort((a: any, b: any) => a.daysToBirthday - b.daysToBirthday)
    }, [activePlayers])


    // Calculate Radar Data
    const aggregateSkills = useMemo(() => {
        let count = 0
        const sums = { fis: 0, def: 0, men: 0, tac: 0, ata: 0, fij: 0 }
        activePlayers.forEach(p => {
            if (p.skills) {
                count++
                sums.fis += (p.skills.speed + p.skills.endurance + p.skills.strength) / 3
                sums.def += (p.skills.tackle + p.skills.defense + p.skills.contact) / 3
                sums.men += p.skills.mentality
                sums.tac += (p.skills.tactical_positioning + p.skills.decision_making) / 2
                sums.ata += (p.skills.attack + p.skills.passing_receiving + (p.skills.kicking || 1) + (p.skills.duel || 1)) / 4
                sums.fij += (p.skills.ruck + p.skills.scrum + p.skills.line_out) / 3
            }
        })

        if (count === 0) return null

        const fullMark = count * 5 // Maximum possible sum if everyone had 5s
        return [
            { subject: 'Físico', A: parseFloat(sums.fis.toFixed(1)), fullMark },
            { subject: 'Defensa', A: parseFloat(sums.def.toFixed(1)), fullMark },
            { subject: 'Mentalidad', A: parseFloat(sums.men.toFixed(1)), fullMark },
            { subject: 'Táctica', A: parseFloat(sums.tac.toFixed(1)), fullMark },
            { subject: 'Ataque', A: parseFloat(sums.ata.toFixed(1)), fullMark },
            { subject: 'Fijos/Ruck', A: parseFloat(sums.fij.toFixed(1)), fullMark },
        ]
    }, [activePlayers])

    // Calculate Positions Data
    const positionsData = useMemo(() => {
        const activeCounts: Record<string, number> = {}
        const totalCounts: Record<string, number> = {}
        players.forEach(p => {
            const pos = p.position ? p.position.split(', ')[0] : 'Sin Pos'
            totalCounts[pos] = (totalCounts[pos] || 0) + 1
            if (p.status === 'Activo') {
                activeCounts[pos] = (activeCounts[pos] || 0) + 1
            }
        })

        const forwards = [
            { position: 'Pilares', current: activeCounts['Pilar'] || 0, total: totalCounts['Pilar'] || 0, color: 'bg-emerald-500' },
            { position: 'Hookers', current: activeCounts['Hooker'] || 0, total: totalCounts['Hooker'] || 0, color: 'bg-emerald-600' },
            { position: 'Segundas', current: activeCounts['Segunda línea'] || 0, total: totalCounts['Segunda línea'] || 0, color: 'bg-emerald-400' },
            { position: 'Alas', current: activeCounts['Ala'] || 0, total: totalCounts['Ala'] || 0, color: 'bg-emerald-300' },
            { position: 'Octavos', current: activeCounts['Octavo'] || 0, total: totalCounts['Octavo'] || 0, color: 'bg-emerald-700' },
        ]

        const backs = [
            { position: 'Medios', current: activeCounts['Medio Scrum'] || 0, total: totalCounts['Medio Scrum'] || 0, color: 'bg-amber-500' },
            { position: 'Aperturas', current: activeCounts['Apertura'] || 0, total: totalCounts['Apertura'] || 0, color: 'bg-amber-600' },
            { position: 'Centros', current: (activeCounts['Primer Centro'] || 0) + (activeCounts['Segundo Centro'] || 0), total: (totalCounts['Primer Centro'] || 0) + (totalCounts['Segundo Centro'] || 0), color: 'bg-amber-400' },
            { position: 'Wings', current: activeCounts['Wing'] || 0, total: totalCounts['Wing'] || 0, color: 'bg-amber-300' },
            { position: 'Full Backs', current: activeCounts['Full Back'] || 0, total: totalCounts['Full Back'] || 0, color: 'bg-amber-700' },
        ]

        return { forwards, backs }
    }, [players])

    // Calculate Attendance
    const presencialidad = useMemo(() => {
        const now = new Date()
        const pastEvents = events.filter(e => new Date(e.event_date) < now && e.status !== 'Cancelado')
        const pastEventIds = pastEvents.map(e => e.id)

        const relevantAttendances = attendance.filter(a => pastEventIds.includes(a.event_id))
        const totalRecords = relevantAttendances.length

        const presentRecords = relevantAttendances.filter(a => ['Presente', 'Titular', 'Suplente'].includes(a.status)).length

        return totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0
    }, [events, attendance])

    const SKILL_KEYS = [
        'passing_receiving', 'ruck', 'tackle', 'contact', 'speed', 'endurance',
        'strength', 'tactical_positioning', 'decision_making', 'line_out',
        'scrum', 'attack', 'defense', 'mentality', 'kicking', 'duel'
    ]

    const technicalGrowth = useMemo(() => {
        let currentTotalScore = 0;
        let pastTotalScore = 0;
        let count = 0;

        const maxScore = SKILL_KEYS.length * 5;

        // Sólo contar jugadores activos que tienen evaluaciones
        activePlayers.forEach(p => {
            const history = p.allSkills || [];
            if (history.length > 0) {
                // Última evaluación (la actual)
                const currSkill = history[0];
                let sumCurr = 0;
                SKILL_KEYS.forEach(k => sumCurr += (currSkill[k] || 1));
                currentTotalScore += Math.round((sumCurr / maxScore) * 100);

                // Evaluación anterior (si no tiene, comparamos con la misma actual o podemos usar la suya misma como baseline => crecimiento 0%)
                const pastSkill = history.length > 1 ? history[1] : history[0];
                let sumPast = 0;
                SKILL_KEYS.forEach(k => sumPast += (pastSkill[k] || 1));
                pastTotalScore += Math.round((sumPast / maxScore) * 100);

                count++;
            }
        });

        if (count === 0) return { current: 0, past: 0, diff: 0, label: '+0 Pts' };

        const currentAvg = Math.round(currentTotalScore / count);
        const pastAvg = Math.round(pastTotalScore / count);
        const diff = currentAvg - pastAvg;

        const sign = diff > 0 ? '+' : '';
        return {
            current: currentAvg,
            past: pastAvg,
            diff,
            label: `${sign}${diff} Pts`
        };
    }, [activePlayers])

    const keyPlayers = useMemo(() => {
        const evaluated = activePlayers.filter(p => p.skills)
        const withScores = evaluated.map(p => {
            let sum = 0
            SKILL_KEYS.forEach(k => sum += (p.skills[k] || 1))
            const max = SKILL_KEYS.length * 5
            const ovr = Math.round((sum / max) * 100)

            return {
                ...p,
                score: ovr,
                name: `${p.first_name.charAt(0)}. ${p.last_name}`,
                devLevel: ovr >= 70 ? 'Elite' : (ovr >= 40 ? 'Titular' : 'Promesa')
            }
        })
        return withScores.sort((a, b) => b.score - a.score).slice(0, 5)
    }, [activePlayers])

    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/30 via-background to-background dark:from-liceo-primary/20 dark:via-background dark:to-background text-foreground transition-colors">
            {/* Header Section */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-liceo-primary to-liceo-accent dark:from-white dark:to-liceo-accent mb-2">
                        {t.dashboard.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Gestión de plantilla — {categoryName} • {tenantName}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl px-6 py-3 border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4 hover:scale-105 transition-transform cursor-pointer">
                        <div className="p-2 bg-liceo-accent/20 rounded-xl text-liceo-accent">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t.dashboard.squad}</p>
                            <p className="text-2xl font-bold">{totalPlayers} <span className="text-sm font-normal text-gray-400">{t.dashboard.players}</span></p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Roster Balance Section */}
                <section className="lg:col-span-2 space-y-6">
                    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-liceo-accent/10 rounded-full blur-3xl -mx-20 -my-20 transition-opacity group-hover:opacity-100 opacity-50"></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-liceo-accent" />
                                Balance Total de Plantilla
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full">Pts Acumulados</span>
                        </div>

                        <div className="h-[300px] w-full relative z-10">
                            {aggregateSkills ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={aggregateSkills}>
                                        <PolarGrid strokeOpacity={0.2} stroke="currentColor" className="text-liceo-primary dark:text-[#5EE5F8]" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }} className="text-gray-500 dark:text-[#809bbb]" />
                                        <PolarRadiusAxis angle={30} domain={[0, aggregateSkills[0].fullMark]} tick={false} axisLine={false} />
                                        <Radar name="Puntos" dataKey="A" stroke="#3A86FF" fill="#3A86FF" fillOpacity={0.4} strokeWidth={2} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#000' }}
                                            itemStyle={{ color: '#3A86FF', fontWeight: 'bold' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold text-center px-6">
                                    No hay evaluaciones de jugadores aún.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Distributions Section */}
                    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <Users className="w-5 h-5 text-emerald-500" />
                                Jugadores por Posición
                            </h2>
                        </div>
                        <div className="space-y-8 relative z-10 mt-6">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-100 dark:border-white/5 pb-2">Forwards</h3>
                                <div className="space-y-4">
                                    {positionsData.forwards.map((pos) => {
                                        const percentage = pos.total > 0 ? (pos.current / pos.total) * 100 : 0
                                        const pending = pos.total - pos.current
                                        return (
                                            <div key={pos.position} className="flex flex-col gap-1.5 group/bar cursor-default">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="font-bold text-xs tracking-wide group-hover/bar:text-emerald-500 transition-colors">{pos.position}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {pos.current} / {pos.total}
                                                        {pending > 0 && <span className="text-amber-500 ml-1">(+{pending} inactivo/s)</span>}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${pos.color} shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-100 dark:border-white/5 pb-2">Backs</h3>
                                <div className="space-y-4">
                                    {positionsData.backs.map((pos) => {
                                        const percentage = pos.total > 0 ? (pos.current / pos.total) * 100 : 0
                                        const pending = pos.total - pos.current
                                        return (
                                            <div key={pos.position} className="flex flex-col gap-1.5 group/bar cursor-default">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="font-bold text-xs tracking-wide group-hover/bar:text-amber-500 transition-colors">{pos.position}</span>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {pos.current} / {pos.total}
                                                        {pending > 0 && <span className="text-amber-500 ml-1">(+{pending} inactivo/s)</span>}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${pos.color} shadow-[0_0_10px_rgba(245,158,11,0.3)]`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Evolution */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl p-6 shadow-lg border border-white/10 hover:-translate-y-1 transition-transform relative overflow-hidden cursor-pointer group flex flex-col justify-between">
                            <ActivitySquare className="w-24 h-24 absolute -bottom-4 -right-4 text-white/10 group-hover:text-white/20 transition-colors" />
                            <h3 className="text-sm font-semibold opacity-80 uppercase tracking-widest mb-1 relative z-10">Presencialidad Total</h3>
                            <div className="relative z-10">
                                <p className="text-4xl font-extrabold">{presencialidad}%</p>
                                <p className="text-xs opacity-80 mt-1 font-medium">Asistencia Histórica</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-liceo-primary to-[#001f3e] text-white rounded-3xl p-6 shadow-lg border border-white/10 hover:-translate-y-1 transition-transform relative overflow-hidden cursor-pointer group flex flex-col justify-between">
                            <TrendingUp className="w-24 h-24 absolute -bottom-4 -right-4 text-white/5 group-hover:text-white/10 transition-colors" />
                            <h3 className="text-sm font-semibold opacity-80 uppercase tracking-widest mb-1 relative z-10">Crecimiento Técnico</h3>
                            <div className="relative z-10">
                                <p className="text-3xl font-bold flex items-center gap-2">
                                    {technicalGrowth.current} OVR
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${technicalGrowth.diff >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {technicalGrowth.label}
                                    </span>
                                </p>
                                <p className="text-[10px] md:text-xs opacity-60 mt-1 font-medium pb-1 md:pb-0">OVR gral. del plantel vs nivel anterior</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar (Right Column) */}
                <section className="space-y-6">
                    {/* Upcoming Birthdays */}
                    {upcomingBirthdays.length > 0 && (
                        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                                <Cake className="w-5 h-5 text-rose-500" />
                                Próximos Cumpleaños
                            </h2>
                            <div className="space-y-3">
                                {upcomingBirthdays.map((player: any) => (
                                    <Link href={`/dashboard/players/${player.id}`} key={player.id} className="group block">
                                        <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden shrink-0">
                                                {player.image_url ? (
                                                    <img src={player.image_url} alt={player.first_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    player.first_name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">{player.first_name} {player.last_name}</p>
                                                <p className="text-xs text-rose-600/80 dark:text-rose-300/80 font-medium">
                                                    {player.daysToBirthday === 0 ? '¡Hoy!' : 
                                                     player.daysToBirthday === 1 ? 'Mañana' : 
                                                     `En ${player.daysToBirthday} días`} 
                                                    <span className="opacity-50 mx-1.5">•</span> 
                                                    {player.birth_date.split('-').reverse().slice(0,2).join('/')}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Players Sidebar */}
                    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-xl h-fit flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <Award className="w-5 h-5 text-amber-500" />
                                {t.dashboard.keyPlayers}
                            </h2>
                        </div>

                        <div className="flex-1 space-y-4">
                            {keyPlayers.map((player) => (
                                <Link href={`/dashboard/players/${player.id}`} key={player.name} className="block group">
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-liceo-accent/50 hover:bg-white dark:hover:bg-white/10 transition-all flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-liceo-primary to-liceo-accent flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden shrink-0">
                                                {player.image_url ? (
                                                    <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    player.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm group-hover:text-liceo-accent transition-colors">{player.name}</p>
                                                <p className="text-xs text-gray-500">{player.position} • {player.devLevel}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold bg-liceo-accent/10 text-liceo-primary dark:text-liceo-accent px-2 py-1 rounded-lg">
                                                {player.score}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <Link href="/dashboard/players" className="mt-6 w-full py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-bold text-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                            {t.dashboard.viewAll}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    )
}
