'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Plus,
    Dumbbell,
    Trophy,
    Search,
    Bell,
    LogOut,
    UserCircle,
    Globe,
    Shield,
    Megaphone,
    Calendar,
    Loader2,
    HelpCircle,
    X,
    BookOpen,
    Sparkles,
    CheckCircle2,
    Settings
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { LangProvider, useLang } from '@/components/lang-provider'
import { ModeToggle } from '@/components/mode-toggle'
import Image from 'next/image'
import { useEffect, useState, useMemo } from 'react'

function DashboardHeader() {
    const { lang, setLang, t } = useLang()
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [scrolled, setScrolled] = useState(false)

    const [tenantName, setTenantName] = useState('Cargando...')
    const [tenantLogo, setTenantLogo] = useState<string | null>(null)
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All')
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isHelpOpen, setIsHelpOpen] = useState(false)

    const basePath = pathname.includes('/dashboard/parent') ? '/dashboard/parent' : '/dashboard/staff'
    const isStaff = basePath === '/dashboard/staff'

    const isActive = (path: string) => {
        if (path === basePath) return pathname === basePath
        return pathname.startsWith(path)
    }

    const getCookie = (name: string) => {
        if (typeof window === 'undefined') return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
    }

    const setCookie = (name: string, val: string) => {
        if (typeof window === 'undefined') return
        document.cookie = `${name}=${val}; path=/; max-age=${60 * 60 * 24 * 365}`
    }

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const fetchHeaderData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id, role, category_id')
                .eq('id', user.id)
                .single()

            if (!profile) return
            setUserRole(profile.role)

            if (profile.tenant_id) {
                // Fetch tenant
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('name, logo_url')
                    .eq('id', profile.tenant_id)
                    .single()

                if (tenant) {
                    setTenantName(tenant.name)
                    setTenantLogo(tenant.logo_url)
                }

                // Fetch categories
                const { data: cats } = await supabase
                    .from('categories')
                    .select('id, name')
                    .eq('tenant_id', profile.tenant_id)

                let finalCats = cats || []
                if (!cats || cats.length === 0) {
                    // Create default 'General' category for new clubs
                    const { data: newCat } = await supabase
                        .from('categories')
                        .insert({ name: 'General', tenant_id: profile.tenant_id })
                        .select()
                        .single()
                    if (newCat) {
                        finalCats = [newCat]
                    }
                }

                if (profile.category_id) {
                    const restrictedCats = finalCats.filter((c: any) => c.id === profile.category_id)
                    setCategories(restrictedCats)
                    setSelectedCategoryId(profile.category_id)
                    setCookie('roaster_selected_category_id', profile.category_id)
                } else {
                    setCategories(finalCats)
                    // Restore active category from cookie
                    const savedCat = getCookie('roaster_selected_category_id')
                    if (savedCat) {
                        setSelectedCategoryId(savedCat)
                    } else {
                        setSelectedCategoryId('All')
                    }
                }
            }
        }

        fetchHeaderData()
    }, [supabase])

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCat = e.target.value
        setCookie('roaster_selected_category_id', newCat)
        setSelectedCategoryId(newCat)
        window.location.reload()
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-[#0B1526]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shadow-md py-3' : 'bg-white dark:bg-[#0B1526] py-4 md:py-5'} px-4 md:px-6 flex items-center justify-between`}>
            {/* Left Box: Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
                <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 dark:border-[#5EE5F8]/30 bg-gray-50 dark:bg-[#111f38] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner"
                    title={lang === 'es' ? 'Identidad visual del club' : 'Club visual identity'}
                >
                    {tenantLogo ? (
                        <img src={tenantLogo} alt="Logo" className="object-contain w-full h-full p-1" />
                    ) : (
                        <span className="font-black text-[#5EE5F8] text-sm uppercase">
                            {tenantName.substring(0, 2)}
                        </span>
                    )}
                </div>
                <div className="flex flex-col">
                    <h1 className="text-liceo-primary dark:text-[#5EE5F8] font-black text-sm md:text-md uppercase tracking-wider leading-tight">
                        {tenantName}
                    </h1>
                    
                    {isStaff && categories.length > 0 ? (
                        <select 
                            value={selectedCategoryId} 
                            onChange={handleCategoryChange}
                            className="bg-transparent text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-bold tracking-wide uppercase focus:outline-none border-b border-transparent hover:border-gray-300 dark:hover:border-white/20 cursor-pointer mt-0.5"
                            title={lang === 'es' ? 'Filtrar vistas por Categoría o División' : 'Filter views by Category or Division'}
                        >
                            <option value="All" className="bg-[#0B1526] text-white">Todas las Categorías</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-[#0B1526] text-white">
                                    Categoría {cat.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs font-semibold tracking-wide uppercase">
                            {t.nav.system}
                        </span>
                    )}
                </div>
            </div>

            {/* Middle Nav for Desktop Only */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 ml-10">
                <Link href={`${basePath}`} className={`${isActive(`${basePath}`) ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.dashboard}</Link>
                {isStaff && (
                    <>
                        <Link href="/dashboard/players" className={`${isActive('/dashboard/players') ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.roster}</Link>
                        <Link href="/dashboard/teams" className={`${isActive('/dashboard/teams') ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.teams}</Link>
                        <Link href="/dashboard/training" className={`${isActive('/dashboard/training') ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.training}</Link>
                        <Link href="/dashboard/matches" className={`${isActive('/dashboard/matches') ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.matches}</Link>
                    </>
                )}
                <Link href={isStaff ? "/dashboard/billboard" : "/dashboard/parent/billboard"} className={`${isActive(isStaff ? "/dashboard/billboard" : "/dashboard/parent/billboard") ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.billboard}</Link>
                {!isStaff && (
                    <Link href="/dashboard/parent/calendar" className={`${isActive("/dashboard/parent/calendar") ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>{t.nav.calendar}</Link>
                )}
            </nav>

            {/* Right Box: Actions */}
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm"
                    title={lang === 'es' ? 'Manual de Ayuda: Consulta guías y funciones del sistema' : 'Help Manual: Read system guides & features'}
                >
                    <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-liceo-primary dark:text-[#5EE5F8]" />
                </button>

                <button
                    onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                    className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] px-2 py-2 md:px-3 md:py-2.5 rounded-xl border border-gray-200 dark:border-white/5 font-bold text-xs"
                    title={lang === 'es' ? 'Cambiar idioma a Inglés' : 'Switch language to Spanish'}
                >
                    <Globe className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline uppercase">{lang}</span>
                </button>

                <div 
                    className="bg-gray-100 dark:bg-[#172540] rounded-xl border border-gray-200 dark:border-white/5 px-2 md:px-2.5 py-1 flex items-center"
                    title={lang === 'es' ? 'Cambiar tema de color (Claro / Oscuro / Sistema)' : 'Toggle color theme (Light / Dark / System)'}
                >
                    <ModeToggle />
                </div>

                {/* Return Search & Bell via dropdowns/modals generally, but keep for desktop space */}
                <button 
                    className="hidden xl:flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5"
                    title={lang === 'es' ? 'Buscar en la plataforma' : 'Search the platform'}
                >
                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button 
                    className="hidden xl:flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5 relative"
                    title={lang === 'es' ? 'Notificaciones y Avisos' : 'Notifications & Alerts'}
                >
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-liceo-accent dark:bg-liceo-gold rounded-full"></span>
                </button>

                {/* Administration Settings Gear Icon Link for Tenant Admins */}
                {(userRole === 'Admin' || userRole === 'Administrador') && (
                    <Link
                        href="/dashboard/admin"
                        className={`flex items-center justify-center p-2 md:p-2.5 rounded-xl border transition-all ${
                            isActive('/dashboard/admin')
                                ? 'bg-liceo-primary/10 border-liceo-primary/30 text-liceo-primary dark:bg-[#5EE5F8]/10 dark:border-[#5EE5F8]/30 dark:text-[#5EE5F8]'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#172540] border-gray-200 dark:border-white/5 shadow-sm'
                        }`}
                        title={lang === 'es' ? 'Administración: Configuración del Club, Categorías y Staff' : 'Administration: Club, Categories & Staff Settings'}
                    >
                        <Settings className="w-4 h-4 md:w-5 md:h-5 animate-hover-spin" />
                    </Link>
                )}

                {/* Profile Mobile/Desktop */}
                <Link 
                    href={isStaff ? "/dashboard/profile" : "/dashboard/parent/profile"} 
                    className="flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5"
                    title={lang === 'es' ? 'Mi Cuenta y Perfil' : 'My Account & Profile'}
                >
                    <UserCircle className="w-4 h-4 md:w-5 md:h-5" />
                </Link>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout} 
                    className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-2"
                    title={lang === 'es' ? 'Cerrar Sesión de forma segura' : 'Log out securely'}
                >
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </div>

            <HelpManualModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                userRole={userRole}
                lang={lang}
            />
        </header>
    )
}

function DashboardBottomNav() {
    const pathname = usePathname()
    const { t } = useLang()
    const supabase = createClient()
    const [userRole, setUserRole] = useState<string | null>(null)

    const basePath = pathname.includes('/dashboard/parent') ? '/dashboard/parent' : '/dashboard/staff'
    const isStaff = basePath === '/dashboard/staff'

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            if (profile) setUserRole(profile.role)
        }
        if (isStaff) fetchRole()
    }, [isStaff, supabase])

    const navItems = isStaff ? [
        { name: t.nav.dashboard, href: '/dashboard/staff', icon: LayoutDashboard },
        { name: t.nav.roster, href: '/dashboard/players', icon: Users },
        { name: t.nav.teams, href: '/dashboard/teams', icon: Shield },
        { name: t.nav.training, href: '/dashboard/training', icon: Dumbbell },
        { name: t.nav.matches, href: '/dashboard/matches', icon: Trophy },
        ...(userRole === 'Admin' || userRole === 'Administrador' ? [{ name: 'Admin', href: '/dashboard/admin', icon: Shield }] : [{ name: t.nav.billboard, href: '/dashboard/billboard', icon: Megaphone }])
    ] : [
        { name: t.nav.dashboard, href: '/dashboard/parent', icon: LayoutDashboard },
        { name: t.nav.calendar, href: '/dashboard/parent/calendar', icon: Calendar },
        { name: t.nav.billboard, href: '/dashboard/parent/billboard', icon: Megaphone }
    ]

    return (
        <div className="lg:hidden fixed bottom-0 w-full bg-white dark:bg-[#0B1526] border-t border-gray-200 dark:border-white/10 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 ${isActive ? 'text-liceo-primary dark:text-[#5EE5F8]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'} transition-colors`}
                    >
                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-[9px] sm:text-[10px] font-semibold uppercase flex-shrink-0 text-center">{item.name}</span>
                    </Link>
                )
            })}
        </div>
    )
}

import { SessionControl } from '@/components/session-control'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()
    const [verifying, setVerifying] = useState(true)

    useEffect(() => {
        const verifySubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setVerifying(false)
                return 
            }

            // Obtener perfil para ver si es Superadmin o tiene tenant
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, tenant_id')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'Superadmin') {
                setVerifying(false)
                return
            }

            if (profile?.tenant_id) {
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('trial_ends_at, subscription_status, is_active')
                    .eq('id', profile.tenant_id)
                    .single()

                if (tenant) {
                    const isExpired = new Date(tenant.trial_ends_at) < new Date()
                    const isInactive = !tenant.is_active || tenant.subscription_status === 'expired'

                    if (isExpired || isInactive) {
                        router.push('/subscription-expired')
                        return
                    }
                }
            }
            setVerifying(false)
        }

        verifySubscription()
    }, [router, supabase])

    if (verifying) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B1526] flex items-center justify-center text-white">
                <Loader2 className="animate-spin rounded-full h-8 w-8 text-[#5EE5F8]" />
            </div>
        )
    }

    return (
        <LangProvider>
            <SessionControl />
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B1526] text-gray-900 dark:text-white flex flex-col font-sans selection:bg-liceo-gold selection:text-[#0B1526]">
                <DashboardHeader />
                <main className="flex-1 w-full pt-20 md:pt-24 pb-24 lg:pb-8">
                    {children}
                </main>
                <DashboardBottomNav />
            </div>
        </LangProvider>
    )
}

// Interactive bilingual User Manual Modal
function HelpManualModal({
    isOpen,
    onClose,
    userRole,
    lang
}: {
    isOpen: boolean
    onClose: () => void
    userRole: string | null
    lang: 'es' | 'en'
}) {
    const [activeTab, setActiveTab] = useState<'admin' | 'staff' | 'parent'>('staff')
    const [searchQuery, setSearchQuery] = useState('')

    // Set initial tab according to the user's role
    useEffect(() => {
        if (!isOpen) return
        const role = userRole?.toLowerCase() || ''
        if (role.includes('admin') || role.includes('superadmin') || role.includes('administrador')) {
            setActiveTab('admin')
        } else if (role.includes('parent') || role.includes('padre') || role.includes('jugador') || role.includes('family') || role.includes('madre') || role.includes('familiar')) {
            setActiveTab('parent')
        } else {
            setActiveTab('staff')
        }
        setSearchQuery('')
    }, [isOpen, userRole])

    if (!isOpen) return null

    const manualData = lang === 'es' ? manualEs : manualEn

    // Filter logic for searching the manual in real time
    const filteredSections = manualData.sections[activeTab].filter(
        (sec) =>
            sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.steps?.some((step) => step.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const isCurrentTabUserRole = () => {
        const role = userRole?.toLowerCase() || ''
        if (activeTab === 'admin' && (role.includes('admin') || role.includes('superadmin') || role.includes('administrador'))) return true
        if (activeTab === 'parent' && (role.includes('parent') || role.includes('padre') || role.includes('jugador') || role.includes('family') || role.includes('madre') || role.includes('familiar'))) return true
        if (activeTab === 'staff' && 
            !role.includes('admin') && !role.includes('superadmin') && !role.includes('administrador') &&
            !role.includes('parent') && !role.includes('padre') && !role.includes('jugador') && !role.includes('family') && !role.includes('madre') && !role.includes('familiar')
        ) return true
        return false
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0E1B30] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative p-6 md:p-8 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-gray-50/50 to-white dark:from-[#11233E]/50 dark:to-[#0E1B30]">
                    <button 
                        onClick={onClose}
                        className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 p-2 rounded-xl"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 text-liceo-primary dark:text-[#5EE5F8]">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-liceo-primary dark:text-[#5EE5F8] tracking-tight">
                            {manualData.title}
                        </h2>
                        <span className="flex items-center gap-1 text-[10px] md:text-xs font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-liceo-gold/10 text-liceo-accent dark:text-[#5EE5F8] dark:bg-white/5 border border-liceo-gold/30 dark:border-white/10 ml-auto mr-10 sm:mr-0">
                            <Sparkles className="w-3 h-3 text-liceo-gold" />
                            {lang === 'es' ? 'Ayuda Inteligente' : 'Smart Help'}
                        </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {manualData.subtitle}
                    </p>

                    {/* Role Indicator Info */}
                    {userRole && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                            <span>{manualData.roleIndicator}</span>
                            <span className="text-liceo-primary dark:text-[#5EE5F8] uppercase tracking-wider">{userRole}</span>
                        </div>
                    )}
                </div>

                {/* Tabs & Search Bar Row */}
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#11233E]/20 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    {/* Navigation Tabs */}
                    <div className="flex bg-gray-200/60 dark:bg-[#162947] p-1 rounded-2xl gap-1 self-start md:self-auto w-full md:w-auto">
                        <button
                            onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}
                            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-2 text-xs md:text-sm font-bold tracking-wide uppercase rounded-xl transition-all ${
                                activeTab === 'admin'
                                    ? 'bg-white dark:bg-[#0B1526] text-liceo-primary dark:text-[#5EE5F8] shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                            }`}
                        >
                            <Shield className="w-4 h-4 flex-shrink-0" />
                            <span>{manualData.tabs.admin}</span>
                            {userRole && (userRole.toLowerCase().includes('admin') || userRole.toLowerCase().includes('superadmin') || userRole.toLowerCase().includes('administrador')) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5EE5F8] animate-ping" />
                            )}
                        </button>
                        
                        <button
                            onClick={() => { setActiveTab('staff'); setSearchQuery(''); }}
                            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-2 text-xs md:text-sm font-bold tracking-wide uppercase rounded-xl transition-all ${
                                activeTab === 'staff'
                                    ? 'bg-white dark:bg-[#0B1526] text-liceo-primary dark:text-[#5EE5F8] shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                            }`}
                        >
                            <Dumbbell className="w-4 h-4 flex-shrink-0" />
                            <span>{manualData.tabs.staff}</span>
                            {userRole && 
                                !userRole.toLowerCase().includes('admin') && !userRole.toLowerCase().includes('superadmin') && !userRole.toLowerCase().includes('administrador') &&
                                !userRole.toLowerCase().includes('parent') && !userRole.toLowerCase().includes('padre') && !userRole.toLowerCase().includes('jugador') && !userRole.toLowerCase().includes('family') && !userRole.toLowerCase().includes('madre') && !userRole.toLowerCase().includes('familiar') && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5EE5F8] animate-ping" />
                            )}
                        </button>

                        <button
                            onClick={() => { setActiveTab('parent'); setSearchQuery(''); }}
                            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-2 text-xs md:text-sm font-bold tracking-wide uppercase rounded-xl transition-all ${
                                activeTab === 'parent'
                                    ? 'bg-white dark:bg-[#0B1526] text-liceo-primary dark:text-[#5EE5F8] shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                            }`}
                        >
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{manualData.tabs.parent}</span>
                            {userRole && (userRole.toLowerCase().includes('parent') || userRole.toLowerCase().includes('padre') || userRole.toLowerCase().includes('jugador') || userRole.toLowerCase().includes('family') || userRole.toLowerCase().includes('madre') || userRole.toLowerCase().includes('familiar')) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5EE5F8] animate-ping" />
                            )}
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={lang === 'es' ? "Buscar función..." : "Search feature..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-[#162947] hover:bg-gray-200/50 dark:hover:bg-[#1d355c] focus:bg-white focus:dark:bg-[#0B1526] text-gray-900 dark:text-white placeholder-gray-400 text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-liceo-primary/30 dark:focus:border-[#5EE5F8]/30 focus:outline-none transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/5">
                    {/* Active tab notice badge */}
                    {isCurrentTabUserRole() && (
                        <div className="p-3.5 rounded-2xl bg-[#5EE5F8]/5 border border-[#5EE5F8]/20 flex items-center gap-3 text-xs text-[#5EE5F8] font-bold tracking-wide uppercase">
                            <span className="w-2 h-2 rounded-full bg-[#5EE5F8] animate-pulse" />
                            {lang === 'es' ? 'Estas son tus herramientas asignadas para tu cuenta' : 'These are the tools assigned to your account'}
                        </div>
                    )}

                    {filteredSections.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Search className="w-12 h-12 text-gray-300 dark:text-white/10 mb-4 stroke-1" />
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">
                                {lang === 'es' ? 'No se encontraron resultados' : 'No results found'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                                {lang === 'es' ? 'Intenta usar palabras claves más generales o cambia de pestaña.' : 'Try using more general keywords or switch tabs.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredSections.map((section, idx) => (
                                <div 
                                    key={idx}
                                    className="group bg-gray-50/50 dark:bg-[#11233E]/30 hover:bg-white dark:hover:bg-[#11233E]/50 border border-gray-100 dark:border-white/5 hover:border-liceo-primary/20 dark:hover:border-[#5EE5F8]/20 p-5 md:p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                        <h3 className="text-md md:text-lg font-black text-gray-800 dark:text-white group-hover:text-liceo-primary dark:group-hover:text-[#5EE5F8] transition-colors">
                                            {section.title}
                                        </h3>
                                        {section.badge && (
                                            <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 text-liceo-primary dark:text-[#5EE5F8]">
                                                {section.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium mb-4 leading-relaxed">
                                        {section.description}
                                    </p>
                                    
                                    {section.steps && section.steps.length > 0 && (
                                        <div className="bg-white/80 dark:bg-[#0B1526]/50 rounded-xl p-4 border border-gray-100 dark:border-white/5 space-y-2.5">
                                            {section.steps.map((step, sIdx) => (
                                                <div key={sIdx} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300 font-medium leading-normal">
                                                    <CheckCircle2 className="w-4 h-4 text-[#5EE5F8] mt-0.5 flex-shrink-0" />
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#11233E]/20 flex items-center justify-between">
                    <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-bold tracking-wide uppercase">
                        RoasterManager v2.1 • User Manual
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-2xl bg-liceo-primary hover:bg-liceo-primary-dark dark:bg-[#5EE5F8] dark:hover:bg-[#47d1e4] text-white dark:text-[#0B1526] font-bold text-xs md:text-sm tracking-wider uppercase transition-colors shadow-md shadow-liceo-primary/10 dark:shadow-none"
                    >
                        {manualData.closeBtn}
                    </button>
                </div>
            </div>
        </div>
    )
}

// BILINGUAL MANUAL CONTENT DEFINITIONS
const manualEs = {
    title: "Manual de Usuario",
    subtitle: "Aprende a dominar todas las funciones de RoasterManager V2 según tu rol.",
    tabs: {
        admin: "Administrador",
        staff: "Staff & Coaches",
        parent: "Familiares & Padres"
    },
    roleIndicator: "Tu rol actual:",
    closeBtn: "Entendido",
    sections: {
        admin: [
            {
                title: "Configuración del Club e Institución",
                description: "Personaliza la identidad visual de tu club. Sube el logo y actualiza el nombre.",
                badge: "Club",
                steps: [
                    "Dirígete al panel de Administración en la barra superior.",
                    "Completa o edita el nombre oficial del club.",
                    "Pega el enlace de la imagen del logo en el campo correspondiente. El sistema lo descargará e importará automáticamente al bucket seguro de Supabase para cargas rápidas.",
                    "Guarda los cambios. El logo se reflejará inmediatamente en toda la cabecera y accesos."
                ]
            },
            {
                title: "Planes y Suscripción",
                description: "Administra el tipo de cuenta activa para tu club y conoce los precios oficiales.",
                badge: "Planes",
                steps: [
                    "Plan Basic (49,99 USD/mes + IVA): Acceso completo a la gestión del plantel de jugadores, toma de asistencia e importación CSV básica.",
                    "Plan Premium (99,99 USD/mes + IVA): Desbloquea categorías y divisiones ilimitadas, planificación avanzada con Bloques Agrupadores en entrenamientos y reportes analíticos de desarrollo de destrezas."
                ]
            },
            {
                title: "Categorías y Divisiones",
                description: "Crea las divisiones competitivas y juveniles (ej. M13, M14) de tu institución.",
                badge: "Estructura",
                steps: [
                    "Accede a Administración > Categorías.",
                    "Crea o edita categorías ilimitadamente (Premium) para agrupar a tus jugadores.",
                    "Asigna entrenadores a categorías específicas para segmentar su visualización."
                ]
            }
        ],
        staff: [
            {
                title: "Gestión de Roster y Plantel",
                description: "Agrega y administra la ficha deportiva de todos tus jugadores.",
                badge: "Plantel",
                steps: [
                    "Alta manual rápida: Completa el formulario de nuevo jugador con datos esenciales.",
                    "Importación masiva CSV: Sube un archivo de Excel/CSV y mapea de forma interactiva qué columna representa el Nombre, DNI, Categoría, Posición, Peso o Altura."
                ]
            },
            {
                title: "Planificador con Bloques Agrupadores",
                description: "Planifica tus prácticas semanales y compártelas de forma directa por WhatsApp.",
                badge: "Entrenamiento",
                steps: [
                    "Ve a 'Entrenamiento' > Planificar Evento.",
                    "Crea 'Bloques Agrupadores' (ej. Preparación Física, Bloque Drills, Bloque Juego).",
                    "Arrastra los ejercicios dentro de cada bloque. La app calcula de forma automática la suma de duración por bloque.",
                    "Presiona 'Compartir por WhatsApp' para generar un reporte formateado listo para enviar."
                ]
            },
            {
                title: "Librería de Drills (Ejercicios)",
                description: "Crea y cataloga tus mejores drills para reutilizarlos en el staff.",
                badge: "Biblioteca",
                steps: [
                    "Un miembro del staff puede definir si un drill es Privado (solo accesible para él) o Público (para todo el club).",
                    "El catálogo almacena videos, duraciones, y descripciones tácticas detalladas."
                ]
            },
            {
                title: "Equipos, Alineaciones y Radar",
                description: "Arma la formación para el fin de semana.",
                badge: "Táctica",
                steps: [
                    "Crea un nuevo equipo (ej. COMPETITIVA) en la sección Equipos.",
                    "Arrastra titulares (1 al 15) y suplentes desde tu plantel disponible.",
                    "Visualiza en tiempo real el radar biométrico y de skills promedio del equipo seleccionado contra el ideal."
                ]
            }
        ],
        parent: [
            {
                title: "Calendario Privado y Seguro",
                description: "Visualiza de forma totalmente segura la agenda deportiva de tus hijos.",
                badge: "Privacidad",
                steps: [
                    "Por motivos de seguridad, los familiares de un jugador sólo pueden ver los eventos deportivos que pertenezcan a la categoría oficial de su hijo.",
                    "Accede a entrenamientos, partidos y avisos consolidados."
                ]
            },
            {
                title: "Métricas de Presentismo y Skills",
                description: "Sigue de cerca el desarrollo de tu hijo de manera integral.",
                badge: "Seguimiento",
                steps: [
                    "Observa los índices de asistencia (Presente / Ausente / Tarde) a lo largo del mes.",
                    "Visualiza el radar de desarrollo de destrezas actualizado por los entrenadores para comprender sus progresos."
                ]
            },
            {
                title: "Cartelera Oficial",
                description: "Mantente informado con avisos importantes en tiempo real.",
                badge: "Noticias",
                steps: [
                    "Recibe de primera mano novedades de último momento, suspensiones por clima o comunicados generales de la directiva del club."
                ]
            }
        ]
    }
}

const manualEn = {
    title: "User Manual",
    subtitle: "Learn to master all features of RoasterManager V2 based on your role.",
    tabs: {
        admin: "Administrator",
        staff: "Staff & Coaches",
        parent: "Parents & Families"
    },
    roleIndicator: "Your current role:",
    closeBtn: "Got it",
    sections: {
        admin: [
            {
                title: "Club & Institution Configuration",
                description: "Customize your club's visual identity. Upload a logo and update the name.",
                badge: "Club",
                steps: [
                    "Go to the Administration panel in the top navigation bar.",
                    "Enter or edit your club's official name.",
                    "Paste the logo image URL. The system will automatically download and store it in Supabase Storage secure bucket for fast loads.",
                    "Save changes. The logo will immediately update across all user interfaces."
                ]
            },
            {
                title: "Plans & Subscriptions",
                description: "Manage the active account plan for your club and check pricing details.",
                badge: "Pricing",
                steps: [
                    "Basic Plan ($49.99 USD/month + VAT): Fully manage players roster, log attendance, and basic CSV imports.",
                    "Premium Plan ($99.99 USD/month + VAT): Unlock unlimited categories and divisions, advanced Grouping Blocks for training, and full skills development analytical reports."
                ]
            },
            {
                title: "Categories & Divisions",
                description: "Set up competitive and youth divisions (e.g., U13, U14) for your club.",
                badge: "Structure",
                steps: [
                    "Go to Administration > Categories.",
                    "Create or edit categories without limits (Premium) to group your players.",
                    "Assign coaches to specific categories to filter access and divide tasks."
                ]
            }
        ],
        staff: [
            {
                title: "Roster & Squad Management",
                description: "Add and manage player records in your directory.",
                badge: "Roster",
                steps: [
                    "Quick manual onboarding: Fill out player profile with essential required details.",
                    "Mass CSV import: Upload any Excel/CSV spreadsheet and interactively map columns like Name, ID, Category, Position, Weight, and Height."
                ]
            },
            {
                title: "Training Planner & Grouping Blocks",
                description: "Structure your weekly practices and share them instantly over WhatsApp.",
                badge: "Training",
                steps: [
                    "Go to 'Training' > Plan Event.",
                    "Create 'Grouping Blocks' (e.g., Physical Prep, Drills Block, Match Play).",
                    "Drag drills inside each block. The app automatically calculates cumulative durations for each section.",
                    "Click 'Share on WhatsApp' to generate a formatted text with emojis, ready to send."
                ]
            },
            {
                title: "Drills Library",
                description: "Create and catalog your best drills to share with the coaching staff.",
                badge: "Library",
                steps: [
                    "Coaches can set drills as Private (only accessible to themselves) or Public (shared with all club coaches).",
                    "Store videos, target durations, and detailed tactical guidelines."
                ]
            },
            {
                title: "Teams, Lineups & Skills Radar",
                description: "Build tactical match formations for the weekend.",
                badge: "Tactics",
                steps: [
                    "Create a new team (e.g., COMPETITIVE) under the Teams section.",
                    "Drag starters (1 to 15) and substitutes from your roster list.",
                    "Visualize biometric averages and skills comparison radars against the team's ideal state."
                ]
            }
        ],
        parent: [
            {
                title: "Private & Secure Calendar Access",
                description: "View your children's schedule with absolute security.",
                badge: "Privacy",
                steps: [
                    "For strict security compliance, family members can only view sports events matching their children's categories.",
                    "Access consolidated dates for training practices, matches, and notifications."
                ]
            },
            {
                title: "Track Attendance & Skills",
                description: "Keep a healthy, comprehensive track of your child's athletic progress.",
                badge: "Progress",
                steps: [
                    "Monitor attendance rates (Present / Absent / Late) throughout the season.",
                    "View the rugby skills radar chart updated by coaches to support their growth."
                ]
            },
            {
                title: "Official Billboard",
                description: "Stay in the loop with official club updates.",
                badge: "Billboard",
                steps: [
                    "Get instant notices of last-minute updates, weather cancellations, or major club alerts direct from the board."
                ]
            }
        ]
    }
}

