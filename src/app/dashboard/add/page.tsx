'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { isStaff } from '@/utils/roles'
import { useLang } from '@/components/lang-provider'
import { ChevronLeft, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AddPlayerPage() {
    const { t } = useLang()
    const router = useRouter()
    const supabase = createClient()

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [nickname, setNickname] = useState('')
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
    const [loading, setLoading] = useState(true) // Start loading to check role
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isStaffValidated, setIsStaffValidated] = useState<boolean | null>(null)

    useEffect(() => {
        const checkRole = async () => {
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
                setIsStaffValidated(true)
                
                // Fetch categories
                if (profile?.tenant_id) {
                    const { data: cats } = await supabase
                        .from('categories')
                        .select('id, name')
                        .eq('tenant_id', profile.tenant_id)
                        .order('name', { ascending: true })
                    
                    if (cats) {
                        setCategories(cats)
                        
                        // Check if there is an active category in cookie
                        const cookies = typeof document !== 'undefined' ? document.cookie.split('; ') : []
                        const savedCatCookie = cookies.find(row => row.startsWith('roaster_selected_category_id='))
                        const savedCatId = savedCatCookie ? savedCatCookie.split('=')[1] : null
                        
                        if (savedCatId && savedCatId !== 'All' && cats.some((c: any) => c.id === savedCatId)) {
                            setSelectedCategoryId(savedCatId)
                        } else if (cats.length > 0) {
                            setSelectedCategoryId(cats[0].id)
                        }
                    }
                }
                
                setLoading(false)
            }
        }
        checkRole()
    }, [router, supabase])

    if (loading && isStaffValidated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-liceo-gold"></div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        if (!firstName.trim() || !lastName.trim()) {
            setError('Faltan datos requeridos.')
            setLoading(false)
            return
        }

        const { error: insertError } = await supabase
            .from('players')
            .insert({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                nickname: nickname.trim() || null,
                category_id: selectedCategoryId || null
            })

        setLoading(false)

        if (insertError) {
            console.error(insertError)
            setError(t.add.error)
        } else {
            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard/players')
            }, 1500)
        }
    }

    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/30 via-background to-background dark:from-liceo-primary/20 dark:via-background dark:to-background text-foreground transition-colors flex flex-col items-center">

            <div className="w-full max-w-2xl">
                {/* Back button */}
                <Link href="/dashboard/players" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-liceo-primary dark:text-gray-400 dark:hover:text-liceo-gold transition-colors mb-6 group">
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    {t.add.back}
                </Link>

                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-xl rounded-3xl p-6 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-liceo-primary to-liceo-accent flex items-center justify-center text-white shadow-lg">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t.add.title}</h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{t.add.subtitle}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-start gap-3 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">{t.add.success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t.add.firstName}</label>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-2 focus:ring-liceo-accent transition-all text-sm font-medium text-gray-900 dark:text-white"
                                    placeholder="Ej: Mariano"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t.add.lastName}</label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-2 focus:ring-liceo-accent transition-all text-sm font-medium text-gray-900 dark:text-white"
                                    placeholder="Ej: González"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t.add.nickname}</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-2 focus:ring-liceo-accent transition-all text-sm font-medium text-gray-900 dark:text-white"
                                    placeholder="Ej: Marian (opcional)"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Categoría</label>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526]/50 focus:outline-none focus:ring-2 focus:ring-liceo-accent transition-all text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#0B1526] text-gray-900 dark:text-white">
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full md:w-auto px-8 py-3.5 bg-liceo-primary hover:bg-liceo-primary/90 dark:bg-liceo-gold dark:hover:bg-yellow-400 rounded-xl shadow-lg dark:shadow-[0_4px_20px_rgba(255,217,0,0.3)] flex items-center justify-center gap-2 transition-all font-bold text-sm text-white dark:text-[#0B1526] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t.add.saving : t.add.saveBtn}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
