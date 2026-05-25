'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
    Heart,
    Calendar,
    Trophy,
    MessageSquare,
    ChevronRight,
    Star,
    Info,
    Bell,
    Users,
    Activity,
    CheckCircle2,
    XCircle,
    BarChart3,
    ArrowRightCircle,
    ShieldCheck,
    Cake,
    User
} from 'lucide-react'
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts'
import { useLang } from '@/components/lang-provider'
import Image from 'next/image'

interface ParentDashboardClientProps {
    profile: any
    childrenData: any[]
    billboardPosts: any[]
    tenantName?: string
}

export default function ParentDashboardClient({ profile, childrenData, billboardPosts, tenantName = 'RoasterManager' }: ParentDashboardClientProps) {
    const { t } = useLang()
    const [selectedChildIndex, setSelectedChildIndex] = useState(0)

    // Evitar errores de hidratación en fechas
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    const activeChild = childrenData.length > 0 ? childrenData[selectedChildIndex] : null

    // Listado de keys para el cálculo del OVR (igual que en Staff)
    const SKILL_KEYS = [
        'passing_receiving', 'ruck', 'tackle', 'contact', 'speed', 'endurance',
        'strength', 'tactical_positioning', 'decision_making', 'line_out',
        'scrum', 'attack', 'defense', 'mentality', 'patada', 'duelo'
    ]

    // Cálculo del Overall (OVR)
    const ovrData = useMemo(() => {
        if (!activeChild?.skills || activeChild.skills.length === 0) return { rating: 0, trend: 'equal' }

        const sortedSkills = [...activeChild.skills].sort((a, b) =>
            new Date(b.date_logged || 0).getTime() - new Date(a.date_logged || 0).getTime()
        )

        const calcScore = (s: any) => {
            let sum = 0
            SKILL_KEYS.forEach(k => sum += (s[k] || 1))
            const max = SKILL_KEYS.length * 5
            return Math.round((sum / max) * 100)
        }

        const currentScore = calcScore(sortedSkills[0])
        const prevScore = sortedSkills.length > 1 ? calcScore(sortedSkills[1]) : currentScore

        let trend = 'equal'
        if (currentScore > prevScore) trend = 'up'
        else if (currentScore < prevScore) trend = 'down'

        return { rating: currentScore, trend }
    }, [activeChild])
    const ovrHistoryData = useMemo(() => {
        if (!activeChild?.skills || activeChild.skills.length === 0) return []

        const sortedSkills = [...activeChild.skills].sort((a: any, b: any) =>
            new Date(a.date_logged || 0).getTime() - new Date(b.date_logged || 0).getTime()
        )
        
        const calcScore = (s: any) => {
            let sum = 0
            SKILL_KEYS.forEach(k => sum += (s[k] || 1))
            const max = SKILL_KEYS.length * 5
            return Math.round((sum / max) * 100)
        }

        return sortedSkills.map((s: any) => ({
            date: new Date(s.date_logged).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
            ovr: calcScore(s)
        }))
    }, [activeChild])
    const handleFixLinkage = async () => {
        const { fixLinkageAction } = await import('./fix-linkage-action')
        const res = await fixLinkageAction()
        if (res.success) alert('Vínculo creado. Recargá la página.')
        else alert('Error: ' + res.error)
    }

    // Resumen de asistencia
    const attendanceSummary = useMemo(() => {
        if (!activeChild?.event_attendance) return null

        let matchCount = 0
        let matchPresent = 0
        let trainingCount = 0
        let trainingPresent = 0

        activeChild.event_attendance.forEach((att: any) => {
            if (att.events?.status === 'Cancelado') return
            if (!['Presente', 'Ausente', 'Tarde', 'Justificado', 'Titular', 'Suplente'].includes(att.status)) return

            const isMatch = att.events?.event_type === 'Partido'
            const isPresent = ['Presente', 'Titular', 'Suplente'].includes(att.status)
            
            if (isMatch) {
                matchCount++
                if (isPresent) matchPresent++
            } else {
                trainingCount++
                if (isPresent) trainingPresent++
            }
        })

        const totalCount = matchCount + trainingCount
        const totalPresent = matchPresent + trainingPresent

        return {
            match: matchCount ? Math.round((matchPresent / matchCount) * 100) : 0,
            training: trainingCount ? Math.round((trainingPresent / trainingCount) * 100) : 0,
            total: totalCount ? Math.round((totalPresent / totalCount) * 100) : 0,
            matchPresent, matchCount, trainingPresent, trainingCount, totalPresent, totalCount
        }
    }, [activeChild])

    // Preparar datos del radar (con nombres de columnas reales de la DB)
    const skillData = useMemo(() => {
        // Ordenamos por fecha descendente para obtener el último log
        const sortedSkills = [...(activeChild?.skills || [])].sort((a, b) =>
            new Date(b.date_logged).getTime() - new Date(a.date_logged).getTime()
        )
        const latest = sortedSkills[0]

        if (!latest) return []

        return [
            { subject: 'Físico', A: (((latest.speed || 1) + (latest.endurance || 1) + (latest.strength || 1)) / 3).toFixed(1), fullMark: 5 },
            { subject: 'Defensa', A: (((latest.tackle || 1) + (latest.defense || 1) + (latest.contact || 1)) / 3).toFixed(1), fullMark: 5 },
            { subject: 'Mentalidad', A: latest.mentality || 1, fullMark: 5 },
            { subject: 'Táctica', A: (((latest.tactical_positioning || 1) + (latest.decision_making || 1)) / 2).toFixed(1), fullMark: 5 },
            { subject: 'Ataque', A: (((latest.attack || 1) + (latest.passing_receiving || 1) + (latest.patada || 1) + (latest.duelo || 1)) / 4).toFixed(1), fullMark: 5 },
            { subject: 'Fijos/Ruck', A: (((latest.ruck || 1) + (latest.scrum || 1) + (latest.line_out || 1)) / 3).toFixed(1), fullMark: 5 },
        ]
    }, [activeChild])

    if (!isMounted) return null // Prevenir flash de hidratación

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-liceo-gold/10 rounded-2xl flex items-center justify-center text-liceo-gold border border-liceo-gold/20">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-liceo-primary dark:text-liceo-gold tracking-tight leading-tight">
                            ¡Hola, {profile?.full_name?.split(' ')[0]}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                            Tu portal de seguimiento — {activeChild ? `${activeChild.category || 'Plantel'} • ` : ''}{tenantName}
                        </p>
                    </div>
                    {childrenData.length === 0 && (
                        <button
                            onClick={handleFixLinkage}
                            className="ml-4 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all uppercase"
                        >
                            Vincular con Julian (Fix)
                        </button>
                    )}
                </div>

                {childrenData.length > 1 && (
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
                        {childrenData.map((child, idx) => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChildIndex(idx)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedChildIndex === idx
                                    ? 'bg-liceo-primary text-white dark:bg-liceo-gold dark:text-[#0B1526] shadow-lg shadow-liceo-primary/20 dark:shadow-liceo-gold/20'
                                    : 'text-gray-400 hover:text-liceo-primary dark:hover:text-white'
                                    }`}
                            >
                                {child.first_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {childrenData.length === 0 ? (
                <div className="bg-white dark:bg-[#111f38] rounded-3xl p-12 border border-gray-100 dark:border-white/5 text-center space-y-4 shadow-xl">
                    <div className="w-20 h-20 bg-liceo-gold/10 rounded-full flex items-center justify-center mx-auto text-liceo-gold border border-liceo-gold/20">
                        <Users className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Sin hijos vinculados</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2 text-sm font-medium">
                            Parece que todavía no tenés hijos asociados a tu cuenta de padre. Contactá al staff para que vinculen tu acceso.
                        </p>
                    </div>
                    <Link href="/dashboard/parent/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-liceo-primary dark:bg-liceo-gold text-white dark:text-[#0B1526] font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                        Ir a mi Perfil <ArrowRightCircle className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">

                    {/* Left Column: Player Info & Skills */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Player Card (Main) */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#062c43] to-[#0B1526] rounded-[2.5rem] p-8 text-white shadow-2xl group border border-white/5">
                            {/* Animated Background Elements */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-liceo-gold/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-liceo-gold/20 transition-all duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-liceo-primary/20 rounded-full blur-[60px] -ml-20 -mb-20"></div>

                            <div className="relative flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                                <div className={`w-48 h-48 md:w-56 md:h-56 rounded-full border-[5px] p-2 flex-shrink-0 bg-white/5 backdrop-blur-sm transform group-hover:scale-105 group-hover:-rotate-3 transition-all duration-700 relative z-10 ${
                                    activeChild.status === 'Activo' 
                                        ? 'border-green-500/80 shadow-[0_0_40px_rgba(34,197,94,0.3)]' 
                                        : activeChild.status === 'Lesionado' 
                                            ? 'border-orange-500/80 shadow-[0_0_40px_rgba(249,115,22,0.3)]' 
                                            : activeChild.status && ['Suspendido', 'Inactivo', 'Cancelado'].includes(activeChild.status)
                                                ? 'border-gray-500/80 shadow-[0_0_40px_rgba(107,114,128,0.3)] grayscale'
                                                : 'border-liceo-gold/60 shadow-[0_0_40px_rgba(197,160,89,0.2)]'
                                }`}>
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/40 to-transparent flex items-center justify-center overflow-hidden border border-white/10 relative">
                                        {activeChild.image_url ? (
                                            <Image
                                                src={activeChild.image_url}
                                                alt={activeChild.first_name}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <Users className="w-24 h-24 md:w-28 md:h-28 text-white/20 transition-transform duration-700 group-hover:scale-110 group-hover:text-liceo-gold/20" />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="inline-flex px-3 py-1 bg-liceo-gold text-[#0B1526] text-[10px] font-black uppercase tracking-[0.2em] rounded-md mb-2">
                                            JUGADOR M13
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase italic">{activeChild.first_name} {activeChild.last_name}</h2>
                                        {activeChild.nickname && (
                                            <p className="text-xl text-liceo-gold/80 font-bold italic">"{activeChild.nickname}"</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-1 w-12 bg-liceo-gold rounded-full"></div>
                                            <p className="text-xs font-bold text-liceo-gold tracking-widest uppercase">Performance Index (OVR): {ovrData.rating}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                                        <div className="flex flex-col bg-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[90px]">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoría</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-liceo-gold" />
                                                <span className="text-xs font-black uppercase text-white">{activeChild.category || '2011'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col bg-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[90px]">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dorsal</span>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-3.5 h-3.5 text-liceo-gold" />
                                                <span className="text-xs font-black uppercase text-white">#{activeChild.number || '13'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col bg-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[90px]">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Posición</span>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3.5 h-3.5 text-liceo-gold" />
                                                <span className="text-xs font-black uppercase text-white">{activeChild.position?.split(',')[0] || 'A Definir'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col bg-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[90px]">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Edad</span>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-liceo-gold" />
                                                <span className="text-xs font-black uppercase text-white">{activeChild.age || '-'} años</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col bg-white/5 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 min-w-[90px]">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumpleaños</span>
                                            <div className="flex items-center gap-2">
                                                <Cake className="w-3.5 h-3.5 text-liceo-gold" />
                                                <span className="text-xs font-black uppercase text-white">
                                                    {activeChild.birth_date ? activeChild.birth_date.split('T')[0].split('-').reverse().slice(0, 2).join('/') : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats & Radar Group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Line Chart (OVR Evolution) */}
                                <div className="bg-white dark:bg-[#111f38] rounded-[2.5rem] p-8 border border-gray-200 dark:border-white/5 shadow-xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-liceo-primary dark:text-liceo-gold uppercase text-xs tracking-widest">Evolución General</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">OVR a lo largo del tiempo</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                            <Activity className="w-5 h-5 text-liceo-gold" />
                                        </div>
                                    </div>
                                    <div className="h-[250px] w-full">
                                        {ovrHistoryData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={ovrHistoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} dx={-10} />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'rgba(255,255,255,0.95)', fontWeight: 'bold' }}
                                                        itemStyle={{ color: '#C5A059' }}
                                                    />
                                                    <Line type="monotone" dataKey="ovr" name="OVR Global" stroke="#C5A059" strokeWidth={4} dot={{ r: 4, fill: '#C5A059', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center opacity-30">
                                                    <BarChart3 className="w-8 h-8" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-tighter">Sin evaluaciones registradas</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Attendance Progress */}
                                <div className="bg-white dark:bg-[#111f38] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-xl">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="space-y-1">
                                            <h3 className="font-black text-liceo-primary dark:text-liceo-gold uppercase text-xs tracking-widest">Presencialidad</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Temporada Actual</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-liceo-gold" />
                                        </div>
                                    </div>

                                    {attendanceSummary ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-5xl font-black text-liceo-primary dark:text-white leading-none">
                                                        {attendanceSummary.total}<span className="text-2xl text-liceo-gold">%</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black py-1.5 px-3 bg-liceo-primary/10 text-liceo-primary dark:bg-[#5EE5F8]/10 dark:text-[#5EE5F8] rounded-lg uppercase tracking-widest">General</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Entrenamientos */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-emerald-500 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Entrenamientos</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{attendanceSummary.training}% ({attendanceSummary.trainingPresent}/{attendanceSummary.trainingCount})</span>
                                                    </div>
                                                    <div className="h-3 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100 dark:border-white/5">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm"
                                                            style={{ width: `${attendanceSummary.training}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Partidos */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-liceo-primary dark:text-[#5EE5F8] flex items-center gap-1.5"><Trophy className="w-3 h-3" /> Partidos</span>
                                                        <span className="text-liceo-primary dark:text-[#5EE5F8] font-black">{attendanceSummary.match}% ({attendanceSummary.matchPresent}/{attendanceSummary.matchCount})</span>
                                                    </div>
                                                    <div className="h-3 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100 dark:border-white/5">
                                                        <div
                                                            className="h-full bg-liceo-primary dark:bg-[#5EE5F8] rounded-full transition-all duration-1000 shadow-sm"
                                                            style={{ width: `${attendanceSummary.match}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/5">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">
                                                    Basado en los últimos {attendanceSummary.totalCount} eventos (con convocatorias).
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-xs text-gray-500 font-bold uppercase">Sin historial de asistencias</p>
                                        </div>
                                    )}
                                </div>
                        </div>

                    </div>

                    {/* Right Column: Billboard & Alerts */}
                    <div className="space-y-8">

                        {/* Mensajes del Staff */}
                        <div className="bg-white dark:bg-[#111f38] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-liceo-primary/5 dark:bg-liceo-gold/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-black text-liceo-primary dark:text-liceo-gold uppercase text-xs tracking-widest">Feed del Staff</h3>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {activeChild.player_messages && activeChild.player_messages.length > 0 ? (
                                    [...activeChild.player_messages].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((msg: any) => (
                                        <div key={msg.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl rounded-tr-sm border border-gray-100 dark:border-white/10 shadow-sm">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{msg.sender_name || 'Staff'}</span>
                                                <span className="text-[9px] text-gray-400 font-bold">{new Date(msg.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{msg.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-400 space-y-2 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <MessageSquare className="w-6 h-6 mx-auto opacity-20" />
                                        <p className="text-[10px] font-bold uppercase italic">Sin feedback reciente</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Billboard Preview */}
                        <div className="bg-white dark:bg-[#111f38] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-liceo-gold animate-bounce" />
                                    <h3 className="font-black text-liceo-primary dark:text-liceo-gold uppercase text-xs tracking-widest">Comunicados</h3>
                                </div>
                                <Link href="/dashboard/parent/billboard" className="text-[10px] font-black text-gray-400 hover:text-liceo-gold transition-colors uppercase tracking-widest border-b border-gray-200 dark:border-white/10 pb-0.5">Ver Todo</Link>
                            </div>

                            <div className="space-y-6">
                                {billboardPosts.length > 0 ? billboardPosts.map((post) => (
                                    <div key={post.id} className="group cursor-pointer">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[8px] font-black text-liceo-gold bg-liceo-gold/5 px-2 py-0.5 rounded uppercase tracking-[0.2em]">{post.category}</span>
                                            <span className="text-[9px] text-gray-400 font-bold">{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-liceo-primary dark:text-white line-clamp-1 group-hover:text-liceo-gold transition-colors mb-2 uppercase tracking-tight">{post.title}</h4>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{post.content}</p>
                                        <div className="h-px bg-gray-100 dark:bg-white/5 mt-4 group-last:hidden"></div>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-gray-400 space-y-2">
                                        <MessageSquare className="w-8 h-8 mx-auto opacity-10" />
                                        <p className="text-[10px] font-bold uppercase italic">Sin comunicados pendientes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Shortcuts */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 mb-2">Accesos Rápidos</h3>

                            <Link href="/dashboard/parent/calendar" className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#111f38] rounded-2xl border border-gray-100 dark:border-white/5 hover:border-liceo-gold/30 hover:scale-[1.02] transition-all group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-liceo-primary dark:text-liceo-gold group-hover:bg-liceo-gold group-hover:text-[#0B1526] transition-all">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div className="text-left space-y-0.5">
                                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">Calendario</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Eventos & Fixture</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-liceo-gold group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link href="/dashboard/parent/roster" className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#111f38] rounded-2xl border border-gray-100 dark:border-white/5 hover:border-liceo-gold/30 hover:scale-[1.02] transition-all group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-liceo-primary dark:text-liceo-gold group-hover:bg-liceo-gold group-hover:text-[#0B1526] transition-all">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="text-left space-y-0.5">
                                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">Plantel</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Compañeros de Equipo</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-liceo-gold group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link href="/dashboard/parent/medical-record" className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#111f38] rounded-2xl border border-gray-100 dark:border-white/5 hover:border-liceo-gold/30 hover:scale-[1.02] transition-all group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-liceo-primary dark:text-liceo-gold group-hover:bg-liceo-gold group-hover:text-[#0B1526] transition-all">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div className="text-left space-y-0.5">
                                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">Ficha Médica</p>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Documentación</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-liceo-gold group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
