'use client'

import React, { useMemo } from 'react'
import { useLang } from '@/components/lang-provider'
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Trophy,
    Dumbbell,
    Info,
    ChevronRight,
    Search
} from 'lucide-react'

interface Event {
    id: string
    title: string
    description?: string | null
    event_date: string
    event_time?: string | null
    location?: string | null
    event_type: string
    category: string
}

export default function CalendarClient({ initialEvents, tenantName = 'RoasterManager' }: { initialEvents: Event[], tenantName?: string }) {
    const { t, lang } = useLang()
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const groupedEvents = useMemo(() => {
        const groups: Record<string, Event[]> = {}
        initialEvents.forEach(event => {
            const date = new Date(event.event_date)
            const monthYear = date.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
                month: 'long',
                year: 'numeric'
            })
            if (!groups[monthYear]) groups[monthYear] = []
            groups[monthYear].push(event)
        })
        return groups
    }, [initialEvents, lang])

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'Entrenamiento': return <Dumbbell className="w-5 h-5" />
            case 'Partido': return <Trophy className="w-5 h-5" />
            default: return <CalendarIcon className="w-5 h-5" />
        }
    }

    const getTagStyles = (type: string) => {
        switch (type) {
            case 'Entrenamiento':
                return 'bg-liceo-primary/10 text-liceo-primary border-liceo-primary/20 dark:bg-white/5 dark:text-gray-300 dark:border-white/10'
            case 'Partido':
                return 'bg-liceo-gold/20 text-[#0B1526] border-liceo-gold/30 dark:bg-liceo-gold dark:text-[#0B1526] dark:border-none'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    if (!isMounted) return null

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-liceo-primary dark:text-liceo-gold tracking-tight uppercase italic leading-none">
                        Calendario
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest">
                        Próximos entrenamientos, partidos y eventos • {tenantName}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 p-1 flex">
                        <div className="px-4 py-2 bg-liceo-primary dark:bg-liceo-gold text-white dark:text-[#0B1526] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Listado
                        </div>
                    </div>
                </div>
            </div>

            {initialEvents.length === 0 ? (
                <div className="bg-white dark:bg-[#111f38] rounded-3xl p-16 border border-gray-100 dark:border-white/5 text-center space-y-4 shadow-xl">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <CalendarIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">Sin eventos próximos</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2 text-sm font-medium">
                            No hay actividades programadas por el staff en este momento. ¡Vuelve pronto!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12 pb-20">
                    {Object.entries(groupedEvents).map(([month, events]) => (
                        <div key={month} className="space-y-6">
                            <h2 className="text-lg font-black text-liceo-primary dark:text-liceo-gold uppercase tracking-[0.3em] flex items-center gap-4">
                                <span className="bg-liceo-primary/10 dark:bg-liceo-gold/20 w-8 h-1 rounded-full"></span>
                                {month}
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {events.map((event) => {
                                    const eventDate = new Date(event.event_date)
                                    const isToday = new Date().toDateString() === eventDate.toDateString()

                                    return (
                                        <div
                                            key={event.id}
                                            className={`relative group bg-white dark:bg-[#111f38] rounded-3xl p-6 border transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${isToday ? 'border-liceo-gold shadow-liceo-gold/10' : 'border-gray-100 dark:border-white/5 shadow-xl shadow-black/5'}`}
                                        >
                                            {isToday && (
                                                <div className="absolute top-0 right-12 bg-liceo-gold text-[#0B1526] px-3 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                                                    Hoy
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Date Block */}
                                                <div className="flex flex-row md:flex-col items-center justify-center bg-gray-50 dark:bg-white/5 px-6 py-4 rounded-2xl border border-gray-100 dark:border-white/10 min-w-[100px] gap-2 md:gap-0">
                                                    <span className="text-3xl font-black text-liceo-primary dark:text-white leading-none">
                                                        {eventDate.getDate()}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {eventDate.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { weekday: 'short' })}
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${getTagStyles(event.event_type)}`}>
                                                                {getEventIcon(event.event_type)}
                                                                {event.event_type}
                                                            </div>
                                                            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase group-hover:text-liceo-primary dark:group-hover:text-liceo-gold transition-colors">
                                                                {event.title}
                                                            </h3>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end">
                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-sm">
                                                                <Clock className="w-4 h-4 text-liceo-gold" />
                                                                {event.event_time ? event.event_time.substring(0, 5) : '00:00'} HS
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                        {event.location && (
                                                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                                                                    <MapPin className="w-4 h-4 text-liceo-accent" />
                                                                </div>
                                                                <span className="truncate">{event.location}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0">
                                                                <Info className="w-4 h-4 text-liceo-gold" />
                                                            </div>
                                                            <span className="truncate">{event.category || 'General'} • {tenantName}</span>
                                                        </div>
                                                    </div>

                                                    {event.description && (
                                                        <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#0B1526]/50 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 text-sm font-medium italic border-l-4 border-l-liceo-gold/50">
                                                            "{event.description}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
