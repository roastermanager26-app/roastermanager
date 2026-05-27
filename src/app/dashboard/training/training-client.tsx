'use client'

import { useState } from 'react'
import { Plus, Database, CalendarDays, BookOpen, AlertCircle, X, Loader2, ArrowRight, Shield, Clock, ExternalLink, Edit2, Trash2, LayoutGrid, List, Check, Save, Users, Image as ImageIcon, Video, UploadCloud, FileText, Download } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { useLang } from '@/components/lang-provider'
import Link from 'next/link'

export default function TrainingClient({ 
    initialEvents, 
    initialDrills, 
    coaches, 
    needsSetup, 
    attendanceCounts = {}, 
    categories = [], 
    userRole, 
    currentCategoryId 
}: { 
    initialEvents: any[]
    initialDrills: any[]
    coaches: any[]
    needsSetup: boolean
    attendanceCounts?: Record<string, number>
    categories?: any[]
    userRole?: string | null
    currentCategoryId?: string | null
}) {
    const supabase = createClient()
    const [events, setEvents] = useState(initialEvents)
    const [drills, setDrills] = useState(initialDrills)
    const [viewMode, setViewMode] = useState<'events' | 'drills'>('events')
    const [eventsLayout, setEventsLayout] = useState<'grid' | 'list'>('grid')
    const { t } = useLang()

    const isAdmin = userRole === 'Admin' || userRole === 'Administrador' || userRole === 'Superadmin'

    const getCookie = (name: string) => {
        if (typeof window === 'undefined') return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
    }

    const currentSelectedCat = getCookie('roaster_selected_category_id') || 'All'
    const defaultCategoryId = currentSelectedCat !== 'All' ? currentSelectedCat : (currentCategoryId || '')

    // Modals & Inline Edit
    const [isCreatingEvent, setIsCreatingEvent] = useState(false)
    const [isCreatingDrill, setIsCreatingDrill] = useState(false)
    const [editingDrillId, setEditingDrillId] = useState<string | null>(null)

    // Inline Event Title Edit
    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [editingEventTitle, setEditingEventTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingExport, setLoadingExport] = useState(false)

    // Form states
    const [newEvent, setNewEvent] = useState({ title: '', event_date: '', event_time: '', location: '', objectives: '', category_id: defaultCategoryId })
    const [newDrill, setNewDrill] = useState({ name: '', description: '', duration_minutes: 15, focus_level_1: '', focus_level_2: '', youtube_link: '', image_url: '', video_url: '', image_urls: [] as string[], pdf_urls: [] as string[], category_id: defaultCategoryId })

    // File Upload States
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [pdfFiles, setPdfFiles] = useState<File[]>([])
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)

    if (needsSetup) {
        return (
            <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] flex items-center justify-center">
                <div className="bg-white dark:bg-[#0B1526] p-8 rounded-3xl shadow-xl max-w-xl text-center border border-gray-200 dark:border-white/10">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Database className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black mb-4 dark:text-white">Base de Datos No Encontrada</h2>
                    <button onClick={() => window.location.reload()} className="bg-liceo-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:opacity-90">
                        Recargar
                    </button>
                </div>
            </div>
        )
    }

    const handleSaveDrill = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        let finalImageUrls = [...(newDrill.image_urls || [])]
        let finalPdfUrls = [...(newDrill.pdf_urls || [])]
        let finalVideoUrl = newDrill.video_url

        try {
            // Upload images
            for (const file of imageFiles) {
                const ext = file.name.split('.').pop()
                const path = `${Math.random()}.${ext}`
                const { error: upErr } = await supabase.storage.from('drills').upload(path, file)
                if (upErr) throw upErr
                const { data: { publicUrl } } = supabase.storage.from('drills').getPublicUrl(path)
                finalImageUrls.push(publicUrl)
            }
            // Upload PDFs
            for (const file of pdfFiles) {
                const ext = file.name.split('.').pop()
                const path = `${Math.random()}.${ext}`
                const { error: upErr } = await supabase.storage.from('drills').upload(path, file)
                if (upErr) throw upErr
                const { data: { publicUrl } } = supabase.storage.from('drills').getPublicUrl(path)
                finalPdfUrls.push(publicUrl)
            }
            // Upload video
            if (videoFile) {
                const ext = videoFile.name.split('.').pop()
                const path = `${Math.random()}.${ext}`
                const { error: upErr } = await supabase.storage.from('drills').upload(path, videoFile)
                if (upErr) throw upErr
                const { data: { publicUrl } } = supabase.storage.from('drills').getPublicUrl(path)
                finalVideoUrl = publicUrl
            }
        } catch (err: any) {
            console.error(err)
            showErrorToast('Error', 'No se pudieron subir algunos archivos multimedia.')
        }

        const drillToSave = {
            name: newDrill.name,
            description: newDrill.description,
            duration_minutes: newDrill.duration_minutes,
            focus_level_1: newDrill.focus_level_1,
            focus_level_2: newDrill.focus_level_2,
            youtube_link: newDrill.youtube_link,
            image_urls: finalImageUrls,
            pdf_urls: finalPdfUrls,
            video_url: finalVideoUrl || null,
            image_url: finalImageUrls[0] || newDrill.image_url, // retrocompatibilidad
            category_id: newDrill.category_id || null // null means General/Public
        }

        if (editingDrillId) {
            const { data, error } = await supabase.from('drills').update(drillToSave).eq('id', editingDrillId).select()
            if (!error && data) {
                setDrills(drills.map((d: any) => d.id === editingDrillId ? data[0] : d))
                closeDrillModal()
                showSuccessToast('Drill Actualizado', 'El ejercicio fue modificado con éxito.')
            } else {
                console.error(error)
                showErrorToast('Error', 'No se pudo actualizar el drill.')
            }
        } else {
            const { data, error } = await supabase.from('drills').insert([drillToSave]).select()
            if (!error && data) {
                setDrills([...drills, data[0]])
                closeDrillModal()
                showSuccessToast('Drill Creado', 'El ejercicio se guardó en la librería.')
            } else {
                console.error(error)
                showErrorToast('Error', 'No se pudo crear el drill.')
            }
        }
        setLoading(false)
    }

    const openEditDrill = (drill: any) => {
        setNewDrill({
            name: drill.name,
            description: drill.description || '',
            duration_minutes: drill.duration_minutes || 15,
            focus_level_1: drill.focus_level_1 || '',
            focus_level_2: drill.focus_level_2 || '',
            youtube_link: drill.youtube_link || '',
            image_url: drill.image_url || '',
            image_urls: drill.image_urls || (drill.image_url ? [drill.image_url] : []),
            pdf_urls: drill.pdf_urls || [],
            video_url: drill.video_url || '',
            category_id: drill.category_id || ''
        })
        setImageFiles([])
        setImagePreviews([])
        setPdfFiles([])
        setVideoFile(null)
        setVideoPreview(drill.video_url || null)
        setEditingDrillId(drill.id)
        setIsCreatingDrill(true)
    }

    const closeDrillModal = () => {
        setIsCreatingDrill(false)
        setEditingDrillId(null)
        setNewDrill({ name: '', description: '', duration_minutes: 15, focus_level_1: '', focus_level_2: '', youtube_link: '', image_url: '', image_urls: [], pdf_urls: [], video_url: '', category_id: defaultCategoryId })
        setImageFiles([])
        setImagePreviews([])
        setPdfFiles([])
        setVideoFile(null)
        setVideoPreview(null)
    }

    const handleDeleteDrill = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este drill de la librería?')) return;

        const { error } = await supabase.from('drills').delete().eq('id', id)
        if (!error) {
            setDrills(drills.filter((d: any) => d.id !== id))
            showSuccessToast('Drill Eliminado', 'Se ha quitado el ejercicio de la librería.')
        } else {
            console.error(error)
            showErrorToast('Error de Integridad', 'No se puede eliminar. Es probable que este drill ya esté asociado a una planificación pasada o futura.')
        }
    }

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        
        const eventToSave = {
            title: newEvent.title,
            event_date: newEvent.event_date,
            event_time: newEvent.event_time,
            location: newEvent.location,
            objectives: newEvent.objectives,
            category_id: newEvent.category_id || null, // null means General
            event_type: 'Entrenamiento',
            status: 'Planificado'
        }

        const { data, error } = await supabase.from('events').insert([eventToSave]).select()
        if (!error && data) {
            setEvents([data[0], ...events]) // Add to top since it's order desc
            setIsCreatingEvent(false)
            setNewEvent({ title: '', event_date: '', event_time: '', location: '', objectives: '', category_id: defaultCategoryId })
            showSuccessToast('Evento Creado', 'Entrenamiento planificado correctamente.')
        } else {
            console.error(error)
            showErrorToast('Error', 'No se pudo crear el evento.')
        }
        setLoading(false)
    }

    const handleSaveEventTitle = async (id: string) => {
        if (!editingEventTitle.trim()) {
            setEditingEventId(null)
            return
        }

        const { error } = await supabase.from('events').update({ title: editingEventTitle }).eq('id', id)
        if (!error) {
            setEvents(events.map((e: any) => e.id === id ? { ...e, title: editingEventTitle } : e))
            setEditingEventId(null)
            showSuccessToast('Título Actualizado', 'El nombre del entrenamiento ha cambiado.')
        } else {
            showErrorToast('Error', 'No se pudo actualizar el nombre.')
        }
    }

    const exportToExcel = async () => {
        setLoadingExport(true)
        try {
            const { data: eventsData, error: evErr } = await supabase
                .from('events')
                .select(`
                    id, title, event_date, event_time, location, objectives, event_type, status,
                    event_plan_slots (
                        id, slot_type, custom_title, duration_minutes, order_index,
                        drills (name)
                    ),
                    event_notes (
                        content
                    ),
                    event_attendance (
                        status
                    )
                `)
                .order('event_date', { ascending: false })

            if (evErr) throw evErr

            const rows: any[] = []
            
            eventsData.forEach((ev: any) => {
                const date = new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-AR')
                const type = ev.event_type === 'Partido' ? 'Juego' : 'Drill'
                const attendanceCount = ev.event_attendance?.filter((a: any) => a.status === 'Presente').length || 0
                const notes = ev.event_notes?.map((n: any) => n.content).join(' | ') || ''
                const sortedSlots = (ev.event_plan_slots || []).sort((a: any, b: any) => a.order_index - b.order_index)
                
                if (sortedSlots.length === 0) {
                    rows.push({
                        'Fecha Entrenamiento': date,
                        'Objetivos': ev.objectives || '',
                        'Hora de inicio': ev.event_time?.slice(0, 5) || '',
                        'Si fue Drill o Juego': type,
                        'Bloque': '-',
                        'Tiempo': '-',
                        'Tiempo Total': '-',
                        'Notas': notes,
                        'Asistencia': attendanceCount
                    })
                } else {
                    let accumulatedTime = 0
                    sortedSlots.forEach((slot: any) => {
                        accumulatedTime += (slot.duration_minutes || 0)
                        const blockName = slot.slot_type === 'drill' 
                            ? (slot.drills?.name || slot.custom_title || 'Drill')
                            : slot.custom_title || (slot.slot_type === 'hydration' ? 'Hidratación' : 'Descanso')
                            
                        rows.push({
                            'Fecha Entrenamiento': date,
                            'Objetivos': ev.objectives || '',
                            'Hora de inicio': ev.event_time?.slice(0, 5) || '',
                            'Si fue Drill o Juego': type,
                            'Bloque': blockName,
                            'Tiempo': slot.duration_minutes || 0,
                            'Tiempo Total': accumulatedTime,
                            'Notas': notes,
                            'Asistencia': attendanceCount
                        })
                    })
                }
            })

            const worksheet = XLSX.utils.json_to_sheet(rows)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Entrenamientos")
            XLSX.writeFile(workbook, "Reporte_Entrenamientos.xlsx")
            
            showSuccessToast('Reporte Exportado', 'El archivo Excel se ha descargado correctamente.')
        } catch (error) {
            console.error(error)
            showErrorToast('Error', 'No se pudo exportar el reporte.')
        } finally {
            setLoadingExport(false)
        }
    }

    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/30 via-background to-background dark:from-liceo-primary/20 dark:via-background dark:to-background text-foreground transition-colors space-y-8">
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-liceo-primary to-liceo-accent dark:from-white dark:to-liceo-accent mb-2">
                        {viewMode === 'events' ? t.training.title : t.training.libraryTitle}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {viewMode === 'events' ? t.training.subtitle : t.training.librarySubtitle}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {viewMode === 'events' && (
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl shadow-inner border border-gray-200 dark:border-white/10 w-full sm:w-auto self-start sm:self-auto">
                            <button onClick={() => setEventsLayout('grid')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${eventsLayout === 'grid' ? 'bg-white dark:bg-[#0B1526] text-liceo-primary dark:text-[#5EE5F8] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEventsLayout('list')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${eventsLayout === 'list' ? 'bg-white dark:bg-[#0B1526] text-liceo-primary dark:text-[#5EE5F8] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {viewMode === 'events' && (
                            <button
                                onClick={exportToExcel}
                                disabled={loadingExport}
                                className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4 py-2.5 shadow-sm text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loadingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Exportar
                            </button>
                        )}
                        <button
                            onClick={() => setViewMode(viewMode === 'events' ? 'drills' : 'events')}
                            className="flex-1 sm:flex-none bg-white hover:bg-gray-50 dark:bg-[#0B1526] dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-sm text-liceo-primary dark:text-[#5EE5F8] font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            {viewMode === 'events' ? <><BookOpen className="w-4 h-4" /> {t.training.viewLibrary}</> : <><CalendarDays className="w-4 h-4" /> {t.training.viewEvents}</>}
                        </button>
                        <button
                            onClick={() => viewMode === 'events' ? setIsCreatingEvent(true) : setIsCreatingDrill(true)}
                            className="flex-1 sm:flex-none bg-liceo-primary hover:bg-liceo-primary/90 dark:bg-liceo-gold dark:hover:bg-yellow-400 rounded-xl px-4 py-2.5 shadow-lg dark:shadow-[0_4px_20px_rgba(255,217,0,0.3)] flex items-center justify-center gap-2 transition-all font-bold text-sm text-white dark:text-[#0B1526]"
                        >
                            <Plus className="w-5 h-5" />
                            {viewMode === 'events' ? t.training.planEvent : t.training.createDrill}
                        </button>
                    </div>
                </div>
            </header>

            {/* CREATE DRILL MODAL */}
            {isCreatingDrill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#0B1526] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black dark:text-white flex items-center gap-2"><BookOpen className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" /> {editingDrillId ? 'Editar Drill' : 'Nuevo Drill'}</h2>
                            <button onClick={closeDrillModal} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
                        </div>
                        <form onSubmit={handleSaveDrill} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nombre del Ejercicio</label>
                                <input required value={newDrill.name} onChange={e => setNewDrill({ ...newDrill, name: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Descripción / Mecánica</label>
                                <textarea required value={newDrill.description} onChange={e => setNewDrill({ ...newDrill, description: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white min-h-[100px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Foco Nivel 1 (Básico)</label>
                                    <input value={newDrill.focus_level_1} onChange={e => setNewDrill({ ...newDrill, focus_level_1: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Foco Nivel 2 (Avanzado)</label>
                                    <input value={newDrill.focus_level_2} onChange={e => setNewDrill({ ...newDrill, focus_level_2: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Duración Default (min)</label>
                                    <input type="number" required value={newDrill.duration_minutes} onChange={e => setNewDrill({ ...newDrill, duration_minutes: parseInt(e.target.value) })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Video Ref (YouTube Link)</label>
                                    <input value={newDrill.youtube_link} onChange={e => setNewDrill({ ...newDrill, youtube_link: e.target.value })} placeholder="https://youtube.com/..." className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white text-sm" />
                                </div>
                            </div>

                            {/* Category Selector for Admins */}
                            {isAdmin && categories.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Categoría / División Asociada</label>
                                    <select 
                                        value={newDrill.category_id} 
                                        onChange={e => setNewDrill({ ...newDrill, category_id: e.target.value })} 
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold"
                                    >
                                        <option value="">Público / General (Todas las Categorías)</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>
                                                Categoría {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
                                <h4 className="text-sm font-bold text-liceo-primary dark:text-[#5EE5F8]">Archivos Adjuntos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Imágenes (Múltiples)</label>
                                        <label className="w-full bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-liceo-primary rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all text-center">
                                            <ImageIcon className="w-5 h-5" />
                                            <span>Subir Imágenes</span>
                                            <input type="file" multiple accept="image/*" onChange={(e) => {
                                                const files = Array.from(e.target.files || [])
                                                setImageFiles(prev => [...prev, ...files])
                                                const prevews = files.map(f => URL.createObjectURL(f))
                                                setImagePreviews(prev => [...prev, ...prevews])
                                            }} className="hidden" />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Documentos PDF</label>
                                        <label className="w-full bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-liceo-primary rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all text-center">
                                            <FileText className="w-5 h-5" />
                                            <span>Subir PDFs</span>
                                            <input type="file" multiple accept="application/pdf" onChange={(e) => {
                                                const files = Array.from(e.target.files || [])
                                                setPdfFiles(prev => [...prev, ...files])
                                            }} className="hidden" />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Video Local</label>
                                        <label className="w-full bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-liceo-primary rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all text-center">
                                            <Video className="w-5 h-5" />
                                            <span className="truncate w-full block">{videoFile || (videoPreview && videoPreview !== newDrill.video_url) ? 'Video ✓' : 'Subir Video'}</span>
                                            <input type="file" accept="video/*" onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)) }
                                            }} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                {/* Previews y Listados */}
                                {(imagePreviews.length > 0 || newDrill.image_urls.length > 0) && (
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {newDrill.image_urls.map((url, i) => (
                                            <div key={'old-' + i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setNewDrill({ ...newDrill, image_urls: newDrill.image_urls.filter((_, index) => index !== i) })} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        {imagePreviews.map((src, i) => (
                                            <div key={'new-' + i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm opacity-80">
                                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => {
                                                    setImageFiles(prev => prev.filter((_, index) => index !== i))
                                                    setImagePreviews(prev => prev.filter((_, index) => index !== i))
                                                }} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(pdfFiles.length > 0 || newDrill.pdf_urls.length > 0) && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {newDrill.pdf_urls.map((url, i) => (
                                            <div key={'old-pdf-' + i} className="flex items-center justify-between bg-blue-50 dark:bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-500/20 col-span-1">
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline truncate"><FileText className="w-3 h-3" /> PDF {i + 1}</a>
                                                <button type="button" onClick={() => setNewDrill({ ...newDrill, pdf_urls: newDrill.pdf_urls.filter((_, index) => index !== i) })} className="text-blue-400 hover:text-red-500 transition-colors p-1"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                        {pdfFiles.map((file, i) => (
                                            <div key={'new-pdf-' + i} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/20 col-span-1">
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1" title={file.name}><FileText className="w-3 h-3" /> {file.name}</span>
                                                <button type="button" onClick={() => setPdfFiles(prev => prev.filter((_, index) => index !== i))} className="text-emerald-400 hover:text-red-500 transition-colors p-1"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {videoPreview && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-inner">
                                        <video src={videoPreview} controls className="w-full h-full object-contain" />
                                        <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(null); setNewDrill({ ...newDrill, video_url: '' }) }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full z-10 shadow-lg hover:bg-red-600 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button type="submit" disabled={loading} className="w-full mt-6 py-3 rounded-xl font-bold bg-liceo-primary dark:bg-liceo-gold text-white dark:text-[#0B1526] hover:opacity-90 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingDrillId ? 'Guardar Cambios' : 'Guardar Drill en Librería'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE EVENT MODAL */}
            {isCreatingEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#0B1526] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black dark:text-white flex items-center gap-2"><CalendarDays className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" /> Nuevo Evento</h2>
                            <button onClick={() => setIsCreatingEvent(false)} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Título / Tipo</label>
                                <input required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Ej. Entrenamiento Martes" className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha</label>
                                    <input type="date" required value={newEvent.event_date} onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hora</label>
                                    <input type="time" required value={newEvent.event_time} onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Lugar</label>
                                <input required value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Cancha 1" className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold" />
                            </div>
                            
                            {/* Category Selector for Admins */}
                            {isAdmin && categories.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Categoría / División</label>
                                    <select 
                                        value={newEvent.category_id} 
                                        onChange={e => setNewEvent({ ...newEvent, category_id: e.target.value })} 
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white font-bold"
                                    >
                                        <option value="">General (Todas las Categorías)</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>
                                                Categoría {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Objetivo del Día</label>
                                <textarea required value={newEvent.objectives} onChange={e => setNewEvent({ ...newEvent, objectives: e.target.value })} placeholder="Duelo, contacto, rucks rápidos..." className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-accent dark:text-white min-h-[80px]" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full mt-6 py-3 rounded-xl font-bold bg-liceo-primary dark:bg-liceo-gold text-white dark:text-[#0B1526] hover:opacity-90 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agendar Entrenamiento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEWS */}
            {viewMode === 'events' && (
                <div className={eventsLayout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                    {events.map((ev: any) => {
                        const isPast = new Date(ev.event_date + 'T' + (ev.event_time || '00:00')) < new Date()
                        const statusToDisplay = ev.status === 'Cancelado' ? 'Cancelado' : (isPast ? 'Completo' : ev.status)
                        const attendees = attendanceCounts[ev.id] || 0

                        return eventsLayout === 'grid' ? (
                            <div key={ev.id} className="bg-white/80 dark:bg-[#0B1526]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col relative group">
                                <div className={`absolute top-4 right-4 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold ${ev.status === 'Cancelado' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : isPast ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                    {statusToDisplay}
                                </div>
                                <div className="pr-16 mb-1">
                                    {editingEventId === ev.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                value={editingEventTitle}
                                                onChange={(e) => setEditingEventTitle(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEventTitle(ev.id); else if (e.key === 'Escape') setEditingEventId(null) }}
                                                className="w-full text-xl font-black text-gray-900 dark:text-white bg-transparent border-b-2 border-liceo-primary dark:border-[#5EE5F8] focus:outline-none"
                                            />
                                            <button onClick={() => handleSaveEventTitle(ev.id)} className="text-emerald-500 p-1"><Save className="w-5 h-5" /></button>
                                            <button onClick={() => setEditingEventId(null)} className="text-gray-400 p-1"><X className="w-5 h-5" /></button>
                                        </div>
                                    ) : (
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white group flex items-center gap-2">
                                            {ev.title}
                                            <button onClick={() => { setEditingEventId(ev.id); setEditingEventTitle(ev.title) }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-liceo-primary transition-opacity"><Edit2 className="w-4 h-4" /></button>
                                        </h3>
                                    )}
                                    {(() => {
                                        const cat = categories.find((c: any) => c.id === ev.category_id)
                                        return cat ? (
                                            <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md mt-1">
                                                Categoría {cat.name}
                                            </span>
                                        ) : null
                                    })()}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-4 mb-4">
                                    <p suppressHydrationWarning className="text-sm text-liceo-primary dark:text-[#5EE5F8] font-bold flex items-center gap-1.5">
                                        <CalendarDays className="w-4 h-4" />
                                        {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-AR')} a las {ev.event_time?.slice(0, 5)}hs
                                    </p>
                                    {isPast && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                                            <Users className="w-4 h-4" />
                                            {attendees} asistencias
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">{ev.objectives}</p>

                                <Link href={`/dashboard/training/${ev.id}`} className="mt-auto flex items-center justify-center gap-2 bg-gray-50 dark:bg-white/5 hover:bg-liceo-primary hover:text-white dark:hover:bg-liceo-gold dark:hover:text-[#0B1526] text-liceo-primary dark:text-liceo-gold py-3 rounded-xl font-bold transition-colors">
                                    {t.training.openPlan}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <div key={ev.id} className="bg-white dark:bg-[#0B1526] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold ${ev.status === 'Cancelado' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : isPast ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                            {statusToDisplay}
                                        </div>
                                        {(() => {
                                            const cat = categories.find((c: any) => c.id === ev.category_id)
                                            return cat ? (
                                                <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                    {cat.name}
                                                </span>
                                            ) : null
                                        })()}
                                        <p suppressHydrationWarning className="text-xs text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-AR')} - {ev.event_time?.slice(0, 5)}hs
                                        </p>
                                        {isPast && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                                                <Users className="w-3 h-3" />
                                                {attendees}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center max-w-lg">
                                        {editingEventId === ev.id ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <input
                                                    autoFocus
                                                    value={editingEventTitle}
                                                    onChange={(e) => setEditingEventTitle(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEventTitle(ev.id); else if (e.key === 'Escape') setEditingEventId(null) }}
                                                    className="flex-1 text-lg font-black text-gray-900 dark:text-white bg-transparent border-b-2 border-liceo-primary dark:border-[#5EE5F8] focus:outline-none py-1"
                                                />
                                                <button onClick={() => handleSaveEventTitle(ev.id)} className="text-emerald-500 p-2"><Save className="w-4 h-4" /></button>
                                                <button onClick={() => setEditingEventId(null)} className="text-gray-400 p-2"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="group flex items-center gap-2 w-full">
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white">{ev.title}</h3>
                                                <button onClick={() => { setEditingEventId(ev.id); setEditingEventTitle(ev.title) }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-liceo-primary transition-opacity p-2"><Edit2 className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{ev.objectives || 'Sin descripción'}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <Link href={`/dashboard/training/${ev.id}`} className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-white/5 hover:bg-liceo-primary hover:text-white dark:hover:bg-liceo-gold dark:hover:text-[#0B1526] text-liceo-primary dark:text-liceo-gold px-6 py-2.5 rounded-xl font-bold transition-colors w-full md:w-auto">
                                        Abrir
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                    {events.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.training.noEvents}</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">{t.training.noEventsDesc}</p>
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'drills' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {drills.map((d: any) => (
                        <div key={d.id} className="bg-white dark:bg-[#0B1526] border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-lg flex flex-col relative group">

                            {/* Action Buttons (Hover) */}
                            <div className="absolute top-4 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                <button onClick={() => openEditDrill(d)} className="p-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-700 dark:text-white shadow-md transition-colors border border-gray-200 dark:border-white/20 backdrop-blur-md">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteDrill(d.id)} className="p-1.5 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/40 rounded-lg text-rose-600 dark:text-rose-400 shadow-md transition-colors border border-rose-200 dark:border-rose-500/30 backdrop-blur-md">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 text-liceo-primary dark:text-[#5EE5F8] rounded-xl flex items-center justify-center font-black">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full group-hover:opacity-0 transition-opacity"><Clock className="w-3 h-3" /> {d.duration_minutes}m</span>
                                    {d.category_id && (() => {
                                        const c = categories.find((x: any) => x.id === d.category_id)
                                        return c ? (
                                            <span className="text-[8px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded group-hover:opacity-0 transition-opacity">{c.name}</span>
                                        ) : null
                                    })()}
                                </div>
                            </div>
                            <h3 className="font-black text-gray-900 dark:text-white mb-2">{d.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">{d.description}</p>

                            <div className="space-y-2 mb-4 flex-1">
                                {d.focus_level_1 && <div className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-1 rounded font-semibold break-words border border-blue-100 dark:border-blue-500/20"><span className="font-black uppercase tracking-wider">Nv 1:</span> {d.focus_level_1}</div>}
                                {d.focus_level_2 && <div className="text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-1 rounded font-semibold break-words border border-purple-100 dark:border-purple-500/20"><span className="font-black uppercase tracking-wider">Nv 2:</span> {d.focus_level_2}</div>}
                            </div>

                            {d.image_urls && d.image_urls.length > 0 ? (
                                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {d.image_urls.map((url: string, i: number) => (
                                        <div key={i} className="flex-shrink-0 w-4/5 aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 scroll-snap-align-start">
                                            <img src={url} alt={d.name} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : d.image_url ? (
                                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 aspect-video">
                                    <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                                </div>
                            ) : null}

                            {d.pdf_urls && d.pdf_urls.length > 0 && (
                                <div className="mb-4 flex flex-col gap-2">
                                    {d.pdf_urls.map((url: string, i: number) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 px-3 py-2.5 rounded-xl transition-colors border border-blue-100 dark:border-blue-500/20 font-bold text-xs truncate">
                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                            Ver Documento PDF Adjunto ({i + 1})
                                        </a>
                                    ))}
                                </div>
                            )}

                            {d.video_url && (
                                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 aspect-video bg-black">
                                    <video src={d.video_url} controls className="w-full h-full object-contain" />
                                </div>
                            )}

                            {d.youtube_link && (
                                <a href={d.youtube_link} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 py-2 rounded-lg transition-colors w-full">
                                    <ExternalLink className="w-3 h-3" />
                                    Ver Video Referencia
                                </a>
                            )}
                        </div>
                    ))}
                    {drills.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t.training.emptyLibrary}</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">{t.training.emptyLibraryDesc}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
