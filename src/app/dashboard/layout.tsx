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
    Loader2
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
        router.refresh()
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-[#0B1526]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shadow-md py-3' : 'bg-white dark:bg-[#0B1526] py-4 md:py-5'} px-4 md:px-6 flex items-center justify-between`}>
            {/* Left Box: Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-200 dark:border-[#5EE5F8]/30 bg-gray-50 dark:bg-[#111f38] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
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
                        {(userRole === 'Admin' || userRole === 'Administrador') && (
                            <Link href="/dashboard/admin" className={`${isActive('/dashboard/admin') ? 'text-liceo-primary dark:text-[#5EE5F8] border-b-2 border-liceo-primary dark:border-[#5EE5F8]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} text-sm font-bold pb-1 transition-colors`}>Administración</Link>
                        )}
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
                    onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                    className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] px-2 py-2 md:px-3 md:py-2.5 rounded-xl border border-gray-200 dark:border-white/5 font-bold text-xs"
                >
                    <Globe className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline uppercase">{lang}</span>
                </button>

                <div className="bg-gray-100 dark:bg-[#172540] rounded-xl border border-gray-200 dark:border-white/5 px-2 md:px-2.5 py-1 flex items-center">
                    <ModeToggle />
                </div>

                {/* Return Search & Bell via dropdowns/modals generally, but keep for desktop space */}
                <button className="hidden xl:flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5">
                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button className="hidden xl:flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5 relative">
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="absolute top-1 right-1.5 w-2 h-2 bg-liceo-accent dark:bg-liceo-gold rounded-full"></span>
                </button>

                {/* Profile Mobile/Desktop */}
                <Link href={isStaff ? "/dashboard/profile" : "/dashboard/parent/profile"} className="flex text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5">
                    <UserCircle className="w-4 h-4 md:w-5 md:h-5" />
                </Link>

                {/* Logout Button */}
                <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-gray-100 dark:bg-[#172540] p-2 md:p-2.5 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-2">
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                </button>
            </div>
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
