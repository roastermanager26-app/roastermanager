'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { isStaff } from '@/utils/roles'
import { useLang } from '@/components/lang-provider'
import { ChevronLeft, FileUp, AlertCircle, CheckCircle, ArrowRight, Upload, Sparkles, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Category {
    id: string
    name: string
}

export default function ImportPlayersPage() {
    const { t } = useLang()
    const router = useRouter()
    const supabase = createClient()

    // Flow stages: 1 = File selection, 2 = Mapping, 3 = Completed
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [fileName, setFileName] = useState<string>('')
    const [headers, setHeaders] = useState<string[]>([])
    const [parsedData, setParsedData] = useState<any[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [defaultCategoryId, setDefaultCategoryId] = useState<string>('')
    const [tenantId, setTenantId] = useState<string>('')
    const [importedCount, setImportedCount] = useState<number>(0)

    // Columns mapping state
    const [mapping, setMapping] = useState<Record<string, string>>({
        first_name: '',
        last_name: '',
        nickname: '',
        category_id: '',
        position: '',
        category: ''
    })

    useEffect(() => {
        const validateAccess = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, tenant_id')
                .eq('id', user.id)
                .single()

            const staffFlag = isStaff(profile?.role)

            if (!staffFlag) {
                router.push('/dashboard/parent')
            } else {
                setTenantId(profile?.tenant_id || '')
                
                // Fetch categories
                if (profile?.tenant_id) {
                    const { data: cats } = await supabase
                        .from('categories')
                        .select('id, name')
                        .eq('tenant_id', profile.tenant_id)
                        .order('name', { ascending: true })
                    
                    if (cats && cats.length > 0) {
                        setCategories(cats)
                        
                        // Select default category based on cookie or first item
                        const cookies = typeof document !== 'undefined' ? document.cookie.split('; ') : []
                        const savedCatCookie = cookies.find(row => row.startsWith('roaster_selected_category_id='))
                        const savedCatId = savedCatCookie ? savedCatCookie.split('=')[1] : null
                        
                        if (savedCatId && savedCatId !== 'All' && cats.some((c: any) => c.id === savedCatId)) {
                            setDefaultCategoryId(savedCatId)
                        } else {
                            setDefaultCategoryId(cats[0].id)
                        }
                    }
                }
                setLoading(false)
            }
        }
        validateAccess()
    }, [router, supabase])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null)
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const fileExtension = file.name.split('.').pop()?.toLowerCase()

        if (fileExtension === 'csv') {
            parseCSV(file)
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            parseExcel(file)
        } else {
            setError('Formato de archivo no soportado. Sube un archivo .CSV o .XLSX')
        }
    }

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const detectedHeaders = Array.from(
                        new Set(results.data.flatMap(row => Object.keys(row as object)))
                    ).filter(h => h && h.trim() !== '')
                    
                    setHeaders(detectedHeaders)
                    setParsedData(results.data)
                    autoMapColumns(detectedHeaders)
                    setStep(2)
                } else {
                    setError('El archivo CSV está vacío.')
                }
            },
            error: (err) => {
                setError('Error al procesar el archivo CSV: ' + err.message)
            }
        })
    }

    const parseExcel = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' })

                if (jsonData && jsonData.length > 0) {
                    const detectedHeaders = Array.from(
                        new Set(jsonData.flatMap(row => Object.keys(row)))
                    ).filter(h => h && h.trim() !== '')

                    setHeaders(detectedHeaders)
                    setParsedData(jsonData)
                    autoMapColumns(detectedHeaders)
                    setStep(2)
                } else {
                    setError('El archivo de Excel está vacío o no tiene datos válidos.')
                }
            } catch (err: any) {
                setError('Error al decodificar el archivo Excel: ' + err.message)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const autoMapColumns = (detectedHeaders: string[]) => {
        const autoMap: Record<string, string> = {
            first_name: '',
            last_name: '',
            nickname: '',
            category_id: '',
            position: '',
            category: ''
        }

        const synonyms: Record<string, string[]> = {
            first_name: ['nombre', 'first name', 'firstname', 'name', 'primer nombre'],
            last_name: ['apellido', 'last name', 'lastname', 'surname', 'segundo nombre'],
            nickname: ['apodo', 'nickname', 'alias', 'sobrenombre'],
            category_id: ['categoria', 'categoría', 'category', 'division', 'división', 'm13', 'm14', 'seccion'],
            position: ['posicion', 'posición', 'position', 'puesto', 'rol'],
            category: ['linea', 'línea', 'group', 'grupo', 'forwards', 'backs']
        }

        detectedHeaders.forEach(header => {
            const lowerHeader = header.toLowerCase().trim()
            Object.entries(synonyms).forEach(([sysKey, list]) => {
                if (list.some(syn => lowerHeader.includes(syn) || syn.includes(lowerHeader))) {
                    if (!autoMap[sysKey]) {
                        autoMap[sysKey] = header
                    }
                }
            })
        })

        setMapping(autoMap)
    }

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mapping.first_name || !mapping.last_name) {
            setError('Las columnas de Nombre y Apellido son obligatorias.')
            return
        }

        setUploading(true)
        setError(null)

        try {
            // Keep a local cached list of categories to avoid repeated inserts
            const { data: latestCats } = await supabase
                .from('categories')
                .select('id, name')
                .eq('tenant_id', tenantId)

            const activeCategories = latestCats ? [...latestCats] : [...categories]
            const playersToInsert: any[] = []

            for (const row of parsedData) {
                const firstNameVal = row[mapping.first_name]?.toString().trim()
                const lastNameVal = row[mapping.last_name]?.toString().trim()

                // Skip rows without required name information
                if (!firstNameVal || !lastNameVal) continue

                const nicknameVal = mapping.nickname ? row[mapping.nickname]?.toString().trim() || null : null
                const positionVal = mapping.position ? row[mapping.position]?.toString().trim() || null : null
                
                // Forwards/Backs processing
                let groupVal = mapping.category ? row[mapping.category]?.toString().trim() || null : null
                if (groupVal) {
                    const lowerGroup = groupVal.toLowerCase()
                    if (lowerGroup.includes('forward') || lowerGroup.includes('delantero') || lowerGroup === 'f') {
                        groupVal = 'Forwards'
                    } else if (lowerGroup.includes('back') || lowerGroup.includes('tres cuartos') || lowerGroup === 'b') {
                        groupVal = 'Backs'
                    } else {
                        groupVal = null // fallback
                    }
                }

                // Category ID resolution
                let catId: string | null = defaultCategoryId

                if (mapping.category_id) {
                    const catNameVal = row[mapping.category_id]?.toString().trim()
                    if (catNameVal) {
                        const matchedCat = activeCategories.find(
                            c => c.name.toLowerCase() === catNameVal.toLowerCase()
                        )

                        if (matchedCat) {
                            catId = matchedCat.id
                        } else {
                            // Category doesn't exist yet, let's create it on the fly!
                            const { data: newCat, error: catErr } = await supabase
                                .from('categories')
                                .insert({ name: catNameVal, tenant_id: tenantId })
                                .select()
                                .single()

                            if (catErr) {
                                console.error('Error creating category dynamically:', catErr)
                            } else if (newCat) {
                                activeCategories.push(newCat)
                                catId = newCat.id
                            }
                        }
                    }
                }

                playersToInsert.push({
                    first_name: firstNameVal,
                    last_name: lastNameVal,
                    nickname: nicknameVal,
                    category_id: catId || null,
                    position: positionVal,
                    category: groupVal,
                    tenant_id: tenantId
                })
            }

            if (playersToInsert.length === 0) {
                setError('No se encontraron filas con nombre y apellido válidos.')
                setUploading(false)
                return
            }

            // Batch insert to prevent timeout issues
            const { error: insertError } = await supabase
                .from('players')
                .insert(playersToInsert)

            if (insertError) {
                throw insertError
            }

            setImportedCount(playersToInsert.length)
            setStep(3)
            setUploading(false)

            setTimeout(() => {
                router.push('/dashboard/players')
            }, 3000)

        } catch (err: any) {
            console.error(err)
            setError('Error al subir los jugadores a la base de datos: ' + (err.message || 'Error desconocido'))
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-liceo-gold"></div>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/30 via-background to-background dark:from-liceo-primary/20 dark:via-background dark:to-background text-foreground transition-colors flex flex-col items-center">
            
            <div className="w-full max-w-3xl">
                {/* Back Link */}
                <Link 
                    href="/dashboard/players" 
                    className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-liceo-primary dark:text-gray-400 dark:hover:text-liceo-gold transition-colors mb-6 group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    {t.add.back}
                </Link>

                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-xl rounded-3xl p-6 md:p-10">
                    
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-liceo-primary to-liceo-accent flex items-center justify-center text-white shadow-lg">
                            <FileUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                {step === 2 ? t.add.mappingTitle : t.add.importTitle}
                            </h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                                {step === 2 ? t.add.mappingSubtitle : t.add.importSubtitle}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Upload File */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-liceo-primary/5 dark:bg-[#5EE5F8]/5 border border-liceo-primary/20 dark:border-[#5EE5F8]/10 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-medium">{t.add.importInfo}</p>
                            </div>

                            {/* Default category choice */}
                            <div className="space-y-2 max-w-md">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                                    Categoría por Defecto
                                    <span title="Si tu archivo no tiene una columna de categoría, los jugadores se cargarán en esta categoría." className="cursor-help">
                                        <HelpCircle className="w-4 h-4 text-gray-400" />
                                    </span>
                                </label>
                                <select
                                    value={defaultCategoryId}
                                    onChange={(e) => setDefaultCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-2 focus:ring-liceo-accent transition-all text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#0B1526] text-gray-900 dark:text-white">
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-liceo-accent dark:hover:border-liceo-accent rounded-3xl p-10 text-center transition-all cursor-pointer relative group bg-gray-50/50 dark:bg-[#0B1526]/20">
                                <input
                                    type="file"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 flex items-center justify-center text-liceo-primary dark:text-[#5EE5F8] group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-base font-extrabold text-gray-900 dark:text-white">
                                            {t.add.selectFile}
                                        </p>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1.5">
                                            Formatos admitidos: .CSV, .XLSX, .XLS
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Mapping columns */}
                    {step === 2 && (
                        <form onSubmit={handleImportSubmit} className="space-y-6">
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-sm">
                                <Sparkles className="w-5 h-5 shrink-0 text-amber-500" />
                                <div>
                                    <p className="font-bold">Mapeo Automático Detectado</p>
                                    <p className="font-medium mt-0.5">Hemos relacionado tus columnas del archivo basándonos en sus nombres. Revisa que correspondan antes de confirmar.</p>
                                </div>
                            </div>

                            <div className="overflow-hidden border border-gray-200 dark:border-white/10 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <th className="px-6 py-4">{t.add.sysField}</th>
                                            <th className="px-6 py-4">{t.add.csvField}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm font-medium">
                                        {/* Nombre */}
                                        <tr>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="text-gray-900 dark:text-white font-bold">Nombre</span>
                                                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full font-bold">{t.add.mappingRequired}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    required
                                                    value={mapping.first_name}
                                                    onChange={(e) => setMapping({ ...mapping, first_name: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-1 focus:ring-liceo-accent text-sm font-semibold text-gray-900 dark:text-white"
                                                >
                                                    <option value="">{t.add.selectColumn}</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        {/* Apellido */}
                                        <tr>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="text-gray-900 dark:text-white font-bold">Apellido</span>
                                                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full font-bold">{t.add.mappingRequired}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    required
                                                    value={mapping.last_name}
                                                    onChange={(e) => setMapping({ ...mapping, last_name: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-1 focus:ring-liceo-accent text-sm font-semibold text-gray-900 dark:text-white"
                                                >
                                                    <option value="">{t.add.selectColumn}</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        {/* Apodo */}
                                        <tr>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="text-gray-700 dark:text-gray-300 font-bold">Apodo</span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full font-bold">{t.add.mappingOptional}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={mapping.nickname}
                                                    onChange={(e) => setMapping({ ...mapping, nickname: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-1 focus:ring-liceo-accent text-sm font-semibold text-gray-900 dark:text-white"
                                                >
                                                    <option value="">{t.add.selectColumn}</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        {/* Categoría */}
                                        <tr>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="text-gray-700 dark:text-gray-300 font-bold">Categoría / División</span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full font-bold">{t.add.mappingOptional}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={mapping.category_id}
                                                    onChange={(e) => setMapping({ ...mapping, category_id: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-1 focus:ring-liceo-accent text-sm font-semibold text-gray-900 dark:text-white"
                                                >
                                                    <option value="">{t.add.selectColumn} (Se creará dinámicamente si no existe)</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        {/* Posición */}
                                        <tr>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="text-gray-700 dark:text-gray-300 font-bold">Posición en Cancha</span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full font-bold">{t.add.mappingOptional}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={mapping.position}
                                                    onChange={(e) => setMapping({ ...mapping, position: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-1 focus:ring-liceo-accent text-sm font-semibold text-gray-900 dark:text-white"
                                                >
                                                    <option value="">{t.add.selectColumn}</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        {/* Línea (Forwards / Backs) */}
                                        <tr>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <span className="text-gray-700 dark:text-gray-300 font-bold">Grupo (Forwards/Backs)</span>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full font-bold">{t.add.mappingOptional}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={mapping.category}
                                                    onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-1 focus:ring-liceo-accent text-sm font-semibold text-gray-900 dark:text-white"
                                                >
                                                    <option value="">{t.add.selectColumn}</option>
                                                    {headers.map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Buttons */}
                            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-sm font-bold"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-8 py-3.5 bg-liceo-primary hover:bg-liceo-primary/90 dark:bg-liceo-gold dark:hover:bg-yellow-400 text-white dark:text-[#0B1526] rounded-xl font-bold text-sm shadow-lg dark:shadow-[0_4px_20px_rgba(255,217,0,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? t.add.importing : t.add.mapAndImportBtn}
                                    {!uploading && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Success Screen */}
                    {step === 3 && (
                        <div className="text-center py-12 flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">¡Importación Exitosa!</h2>
                                <p className="text-base text-gray-500 dark:text-gray-400 mt-2 font-medium">
                                    Se han procesado e importado <strong className="text-liceo-primary dark:text-[#5EE5F8]">{importedCount}</strong> jugadores al plantel.
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 animate-pulse">
                                    Redirigiendo al plantel...
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    )
}
