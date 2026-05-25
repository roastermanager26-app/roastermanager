'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import {
    Users, Plus, Trash2, Edit2, ShieldAlert,
    FolderPlus, Info, Check, Copy, Baby, Search,
    Loader2, CheckCircle, ShieldCheck, X, Building
} from 'lucide-react'
import {
    createClubCategory,
    createClubUser,
    updateClubUser,
    deleteClubUser,
    updateClubMetadata
} from './actions'

type Category = {
    id: string
    name: string
    description: string | null
    created_at: string
}

type Profile = {
    id: string
    full_name: string
    email: string | null
    role: string
    phone: string | null
    is_active: boolean
    is_parent: boolean
    player_parents?: { player_id: string }[]
}

type Player = {
    id: string
    first_name: string
    last_name: string
    category_id: string | null
    category: string | null
}

type Tenant = {
    id: string
    name: string
    logo_url: string | null
}

export default function AdminClient({
    initialCategories,
    initialUsers,
    initialPlayers,
    initialTenant
}: {
    initialCategories: Category[]
    initialUsers: Profile[]
    initialPlayers: Player[]
    initialTenant: Tenant
}) {
    const router = useRouter()
    
    // Core data state
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [users, setUsers] = useState<Profile[]>(initialUsers)
    const [players] = useState<Player[]>(initialPlayers)
    const [tenant, setTenant] = useState<Tenant>(initialTenant)

    // Active tab
    const [activeTab, setActiveTab] = useState<'categories' | 'users' | 'tenant'>('categories')

    // Modals & Action states
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [isCreatingUser, setIsCreatingUser] = useState(false)
    const [isEditingUser, setIsEditingUser] = useState<Profile | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

    // Form states - Category
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

    // Form states - User
    const [userForm, setUserForm] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'Entrenador',
        phone: '',
        is_parent: false,
        selectedChildren: [] as string[]
    })

    // Edit user form state
    const [editUserForm, setEditUserForm] = useState({
        full_name: '',
        role: 'Entrenador',
        phone: '',
        is_active: true,
        is_parent: false,
        selectedChildren: [] as string[]
    })

    // Form states - Tenant Settings
    const [tenantForm, setTenantForm] = useState({
        name: tenant.name,
        logo_url: tenant.logo_url || ''
    })

    // Temp state for credentials sharing
    const [registeredCredentials, setRegisteredCredentials] = useState<{
        email: string
        pass: string
        name: string
    } | null>(null)
    const [copied, setCopied] = useState(false)

    // Search child player in users form
    const [childSearch, setChildSearch] = useState('')

    const filteredPlayers = useMemo(() => {
        if (!childSearch.trim()) return []
        return players.filter(p =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(childSearch.toLowerCase())
        ).slice(0, 5)
    }, [childSearch, players])

    // Generate automatic secure password for new users
    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#'
        let pass = ''
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        pass += 'R@'
        setUserForm(prev => ({ ...prev, password: pass }))
    }

    // Handlers
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!categoryForm.name.trim()) return

        setIsSaving(true)
        const res = await createClubCategory(categoryForm.name, categoryForm.description)
        setIsSaving(false)

        if (res.error) {
            showErrorToast('Error', res.error)
        } else {
            showSuccessToast('Categoría Creada', `La categoría "${categoryForm.name}" se creó correctamente.`)
            if (res.category) {
                setCategories(prev => [...prev, res.category as Category])
            }
            setCategoryForm({ name: '', description: '' })
            setIsCreatingCategory(false)
            router.refresh()
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userForm.email || !userForm.full_name) {
            showErrorToast('Faltan Datos', 'El email y el nombre completo son obligatorios.')
            return
        }

        const passwordToUse = userForm.password || 'Roaster@2026'

        setIsSaving(true)
        const res = await createClubUser({
            email: userForm.email,
            password: passwordToUse,
            full_name: userForm.full_name,
            role: userForm.role,
            phone: userForm.phone,
            is_parent: userForm.is_parent,
            selectedChildren: userForm.selectedChildren
        })
        setIsSaving(false)

        if (res.error) {
            showErrorToast('Error', res.error)
        } else {
            showSuccessToast('Usuario Creado', 'El miembro del club fue registrado con éxito.')
            setRegisteredCredentials({
                email: userForm.email,
                pass: passwordToUse,
                name: userForm.full_name
            })
            // Reset form
            setUserForm({
                email: '',
                password: '',
                full_name: '',
                role: 'Entrenador',
                phone: '',
                is_parent: false,
                selectedChildren: []
            })
            setIsCreatingUser(false)
            
            // Reload users
            router.refresh()
            // To update local list immediately, just pull from page refresh
            setTimeout(() => { window.location.reload() }, 1500)
        }
    }

    const handleEditUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isEditingUser) return

        setIsSaving(true)
        const res = await updateClubUser({
            id: isEditingUser.id,
            full_name: editUserForm.full_name,
            role: editUserForm.role,
            phone: editUserForm.phone,
            is_active: editUserForm.is_active,
            is_parent: editUserForm.is_parent,
            selectedChildren: editUserForm.selectedChildren
        })
        setIsSaving(false)

        if (res.error) {
            showErrorToast('Error', res.error)
        } else {
            showSuccessToast('Usuario Actualizado', 'El perfil ha sido modificado.')
            setIsEditingUser(null)
            router.refresh()
            setTimeout(() => { window.location.reload() }, 1000)
        }
    }

    const handleDeleteUserClick = async (userId: string, userName: string) => {
        if (!confirm(`¿Estás completamente seguro de que querés eliminar a "${userName}"?\nEsta acción es irreversible y removerá su acceso de forma inmediata.`)) {
            return
        }

        setIsDeletingId(userId)
        const res = await deleteClubUser(userId)
        setIsDeletingId(null)

        if (res.error) {
            showErrorToast('Error', res.error)
        } else {
            showSuccessToast('Usuario Eliminado', 'El miembro ha sido removido del sistema.')
            setUsers(prev => prev.filter(u => u.id !== userId))
            router.refresh()
        }
    }

    const handleUpdateMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tenantForm.name.trim()) return

        setIsSaving(true)
        const res = await updateClubMetadata(tenantForm.name, tenantForm.logo_url)
        setIsSaving(false)

        if (res.error) {
            showErrorToast('Error', res.error)
        } else {
            showSuccessToast('Institución Actualizada', 'Los datos del club han sido modificados.')
            setTenant(prev => ({
                ...prev,
                name: tenantForm.name,
                logo_url: tenantForm.logo_url || null
            }))
            router.refresh()
        }
    }

    const copyCredentials = () => {
        if (!registeredCredentials) return
        const text = `RoasterManager — ¡Acceso Creado!\n\nHola ${registeredCredentials.name},\nTe han registrado como administrador/staff en RoasterManager.\n\nAcceso:\n- Email: ${registeredCredentials.email}\n- Clave temporal: ${registeredCredentials.pass}\n\nIngresá en: ${window.location.origin}/login\n*Recordá cambiar tu contraseña en tu primer ingreso.`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Sync Edit form when editing user changes
    useEffect(() => {
        if (isEditingUser) {
            const childIds = isEditingUser.player_parents?.map(p => p.player_id) || []
            setEditUserForm({
                full_name: isEditingUser.full_name,
                role: isEditingUser.role,
                phone: isEditingUser.phone || '',
                is_active: isEditingUser.is_active,
                is_parent: isEditingUser.is_parent,
                selectedChildren: childIds
            })
        }
    }, [isEditingUser])

    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/20 via-background to-background dark:from-liceo-primary/10 dark:via-background dark:to-background text-foreground space-y-8 max-w-7xl mx-auto font-sans">
            
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-liceo-primary to-liceo-accent dark:from-white dark:to-[#5EE5F8] mb-2 uppercase">
                    Panel de Administración
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                    Gestioná las categorías de juego, registrá usuarios (Staff o Padres) y personalizá los datos visuales de {tenant.name}.
                </p>
            </header>

            {/* Premium Glassmorphic Tab switcher */}
            <div className="flex border-b border-gray-200 dark:border-white/10 p-1 bg-white/50 dark:bg-[#0B1526]/50 backdrop-blur-md rounded-2xl w-full max-w-2xl gap-2">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'categories' ? 'bg-liceo-primary text-white dark:bg-[#5EE5F8] dark:text-[#0B1526] shadow-lg shadow-liceo-primary/20' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                >
                    <FolderPlus className="w-4 h-4" />
                    Categorías ({categories.length})
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-liceo-primary text-white dark:bg-[#5EE5F8] dark:text-[#0B1526] shadow-lg shadow-liceo-primary/20' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                >
                    <Users className="w-4 h-4" />
                    Personal y Padres ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('tenant')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'tenant' ? 'bg-liceo-primary text-white dark:bg-[#5EE5F8] dark:text-[#0B1526] shadow-lg shadow-liceo-primary/20' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'}`}
                >
                    <Building className="w-4 h-4" />
                    Mi Institución
                </button>
            </div>

            {/* TAB CONTENT: CATEGORIES */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black uppercase tracking-tight text-liceo-primary dark:text-[#5EE5F8]">
                            Divisiones y Categorías
                        </h2>
                        <button
                            onClick={() => setIsCreatingCategory(true)}
                            className="bg-liceo-primary text-white dark:bg-[#5EE5F8]/10 dark:hover:bg-[#5EE5F8]/20 dark:text-[#5EE5F8] hover:bg-liceo-primary/90 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-liceo-primary/10 dark:border-[#5EE5F8]/20 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Crear Categoría
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className="bg-white dark:bg-[#0B1526] rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-lg flex flex-col justify-between group hover:border-liceo-primary/40 dark:hover:border-[#5EE5F8]/40 transition-all duration-300"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 flex items-center justify-center">
                                            <FolderPlus className="w-5 h-5 text-liceo-primary dark:text-[#5EE5F8]" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            División
                                        </span>
                                    </div>
                                    <h3 className="font-extrabold text-xl dark:text-white group-hover:text-liceo-primary dark:group-hover:text-[#5EE5F8] transition-colors leading-tight uppercase">
                                        {cat.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 leading-relaxed">
                                        {cat.description || 'Sin descripción adicional cargada.'}
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-semibold uppercase">
                                    <span>Creada</span>
                                    <span>{new Date(cat.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}

                        {categories.length === 0 && (
                            <div className="col-span-full bg-white/50 dark:bg-[#0B1526]/50 backdrop-blur-md rounded-3xl p-12 text-center border border-dashed border-gray-300 dark:border-white/10">
                                <ShieldAlert className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                                <h3 className="font-black text-lg dark:text-white uppercase">Sin Categorías Activas</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                                    Creá tu primera categoría (ej: "M14", "Primera", "M16") para poder agrupar a tus jugadores y segmentar entrenamientos y partidos.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: USERS */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black uppercase tracking-tight text-liceo-primary dark:text-[#5EE5F8]">
                            Staff, Entrenadores y Padres
                        </h2>
                        <button
                            onClick={() => setIsCreatingUser(true)}
                            className="bg-liceo-primary text-white dark:bg-[#5EE5F8]/10 dark:hover:bg-[#5EE5F8]/20 dark:text-[#5EE5F8] hover:bg-liceo-primary/90 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-liceo-primary/10 dark:border-[#5EE5F8]/20 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Registrar Usuario
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#0B1526] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-[#111f38] border-b border-gray-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                        <th className="py-4 px-6">Miembro</th>
                                        <th className="py-4 px-6">Email / Acceso</th>
                                        <th className="py-4 px-6">Rol</th>
                                        <th className="py-4 px-6">Contacto</th>
                                        <th className="py-4 px-6">Estado</th>
                                        <th className="py-4 px-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                                    {users.map(u => {
                                        const childrenCount = u.player_parents?.length || 0
                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="py-4 px-6 font-extrabold text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 text-liceo-primary dark:text-[#5EE5F8] font-black text-sm flex items-center justify-center uppercase">
                                                            {u.full_name.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="uppercase">{u.full_name}</span>
                                                            {u.is_parent && (
                                                                <span className="text-[9px] bg-[#5EE5F8]/20 text-[#5EE5F8] font-black px-1.5 py-0.5 rounded border border-[#5EE5F8]/20 uppercase w-fit mt-1 flex items-center gap-1">
                                                                    <Baby className="w-2.5 h-2.5" /> Familiar: {childrenCount} vinculados
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-gray-500 dark:text-gray-400">{u.email || 'Sin cuenta'}</td>
                                                <td className="py-4 px-6">
                                                    <span className="text-xs bg-gray-100 dark:bg-[#152744] text-gray-800 dark:text-white px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-gray-500 dark:text-gray-400">{u.phone || '—'}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide ${u.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                        {u.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setIsEditingUser(u)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-liceo-primary dark:hover:text-[#5EE5F8]"
                                                            title="Editar miembro"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUserClick(u.id, u.full_name)}
                                                            disabled={isDeletingId === u.id}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-red-500 disabled:opacity-30"
                                                            title="Eliminar miembro"
                                                        >
                                                            {isDeletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: METADATA */}
            {activeTab === 'tenant' && (
                <div className="max-w-3xl">
                    <div className="bg-white dark:bg-[#0B1526] rounded-3xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-xl space-y-6">
                        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-white/5">
                            <div className="w-16 h-16 rounded-2xl bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 text-liceo-primary dark:text-[#5EE5F8] flex items-center justify-center shadow-inner overflow-hidden border border-gray-100 dark:border-white/5">
                                {tenantForm.logo_url ? (
                                    <img src={tenantForm.logo_url} alt="Logo" className="object-contain w-full h-full p-2" />
                                ) : (
                                    <Building className="w-8 h-8" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-black dark:text-white uppercase leading-tight">{tenant.name}</h3>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Configuración e Identidad Visual</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateMetadata} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                                    Nombre de la Institución
                                </label>
                                <input
                                    required
                                    value={tenantForm.name}
                                    onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary dark:focus:ring-[#5EE5F8] font-bold dark:text-white text-sm"
                                    placeholder="Ej: Liceo Naval Club"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                                    URL del Logo de la Institución
                                </label>
                                <input
                                    value={tenantForm.logo_url}
                                    onChange={e => setTenantForm({ ...tenantForm, logo_url: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary dark:focus:ring-[#5EE5F8] font-bold dark:text-white text-sm"
                                    placeholder="https://ejemplo.com/logo.png"
                                />
                                <p className="text-[11px] text-gray-500 font-medium ml-1 leading-relaxed">
                                    Ingresá un enlace web directo a una imagen cuadrada (PNG/JPG) con el escudo del club. Este logo aparecerá en el encabezado de todos los usuarios de la institución.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 rounded-xl font-black tracking-widest bg-liceo-primary hover:bg-liceo-primary/90 text-white dark:bg-[#5EE5F8] dark:hover:bg-[#4bc8da] dark:text-[#061B30] flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-xl disabled:opacity-50 uppercase text-xs"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATED USER CREDENTIALS MODAL */}
            {registeredCredentials && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">¡Registro Exitoso!</h2>
                            <p className="text-gray-400 font-medium">Copiá y enviá las credenciales temporales al nuevo usuario para que pueda acceder:</p>

                            <div className="bg-[#0B1526] p-6 rounded-3xl border border-white/5 text-left relative group">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nombre Completo</p>
                                        <p className="text-white font-bold uppercase">{registeredCredentials.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Email de Acceso</p>
                                        <p className="text-white font-bold">{registeredCredentials.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Contraseña Temporal</p>
                                        <p className="text-liceo-gold font-mono font-black text-xl tracking-widest">{registeredCredentials.pass}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={copyCredentials}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    {copied ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6 text-gray-400" />}
                                </button>
                            </div>

                            <button
                                onClick={() => setRegisteredCredentials(null)}
                                className="w-full py-4 bg-liceo-primary dark:bg-white text-white dark:text-[#0B1526] rounded-2xl font-black uppercase tracking-widest shadow-lg"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE CATEGORY MODAL */}
            {isCreatingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <FolderPlus className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" />
                                    Nueva Categoría
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingCategory(false)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                        Nombre de la Categoría
                                    </label>
                                    <input
                                        required
                                        value={categoryForm.name}
                                        onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                        placeholder="Ej: M15, Plantel Superior, Femenino"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                        Descripción / Notas (Opcional)
                                    </label>
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-medium dark:text-white text-sm h-28 resize-none"
                                        placeholder="Describí brevemente a qué división o rango de edad aplica..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 rounded-xl font-black bg-liceo-primary hover:bg-liceo-primary/95 text-white dark:bg-[#5EE5F8] dark:hover:bg-[#4bc8da] dark:text-[#061B30] uppercase text-xs tracking-widest disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Crear Categoría'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE USER MODAL */}
            {isCreatingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-2xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Users className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" />
                                    Registrar Miembro
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingUser(false)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            value={userForm.full_name}
                                            onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                            placeholder="Ej: Juan Pérez"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email / Acceso</label>
                                        <input
                                            required
                                            type="email"
                                            value={userForm.email}
                                            onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Rol Operativo</label>
                                        <select
                                            value={userForm.role}
                                            onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm appearance-none"
                                        >
                                            <option value="Entrenador">Entrenador</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Preparador Físico">Preparador Físico</option>
                                            <option value="Admin">Administrador (Admin)</option>
                                            <option value="Padres">Padre / Familiar</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Teléfono (Opcional)</label>
                                        <input
                                            value={userForm.phone}
                                            onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                            placeholder="+54 9 11 2345 6789"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Contraseña de Acceso (Opcional)</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={userForm.password}
                                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                                className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                                placeholder="Por defecto: Roaster@2026"
                                            />
                                            <button
                                                type="button"
                                                onClick={generatePassword}
                                                className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all border border-gray-200 dark:border-white/5 font-semibold text-xs text-gray-500 dark:text-white"
                                            >
                                                Generar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col h-full bg-[#0B1526]/50 p-6 rounded-[2rem] border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userForm.is_parent ? 'bg-[#5EE5F8] text-[#0B1526]' : 'bg-white/5 text-gray-500'}`}>
                                                    <Baby className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black dark:text-white uppercase tracking-wider">Es Familiar / Padre</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">Vincula con jugadores</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={userForm.is_parent}
                                                    onChange={e => setUserForm({ ...userForm, is_parent: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        {userForm.is_parent && (
                                            <div className="flex-1 flex flex-col min-h-[180px]">
                                                <div className="relative mb-4">
                                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                                    <input
                                                        value={childSearch}
                                                        onChange={e => setChildSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold dark:text-white"
                                                        placeholder="Buscar jugador..."
                                                    />
                                                    {filteredPlayers.length > 0 && (
                                                        <div className="absolute top-full left-0 w-full bg-[#1e293b] border border-white/10 rounded-xl mt-1 shadow-2xl z-20 overflow-hidden">
                                                            {filteredPlayers.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!userForm.selectedChildren.includes(p.id)) {
                                                                            setUserForm({
                                                                                ...userForm,
                                                                                selectedChildren: [...userForm.selectedChildren, p.id]
                                                                            })
                                                                        }
                                                                        setChildSearch('')
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 text-[11px] font-black text-gray-300 hover:bg-[#5EE5F8] hover:text-[#0B1526] transition-colors border-b border-white/5 last:border-0"
                                                                >
                                                                    {p.first_name} {p.last_name} {p.category ? `(${p.category})` : ''}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 overflow-y-auto space-y-2 max-h-[180px] bg-black/10 rounded-xl p-3 border border-white/5">
                                                    {userForm.selectedChildren.map(cid => {
                                                        const player = players.find(p => p.id === cid)
                                                        return (
                                                            <div key={cid} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                                                <span className="text-[10px] font-black dark:text-white uppercase tracking-wider">
                                                                    {player?.first_name} {player?.last_name}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setUserForm({
                                                                        ...userForm,
                                                                        selectedChildren: userForm.selectedChildren.filter(id => id !== cid)
                                                                    })}
                                                                    className="text-red-400 hover:text-red-500 p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                    {userForm.selectedChildren.length === 0 && (
                                                        <p className="text-[10px] text-gray-600 font-bold text-center mt-4 uppercase">
                                                            Elegí los hijos vinculados
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 rounded-xl font-black bg-liceo-primary hover:bg-liceo-primary/95 text-white dark:bg-[#5EE5F8] dark:hover:bg-[#4bc8da] dark:text-[#061B30] uppercase text-xs tracking-widest disabled:opacity-50 shadow-lg"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Registrar y Habilitar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {isEditingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-2xl rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={handleEditUserSubmit} className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Edit2 className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" />
                                    Editar Miembro
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingUser(null)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            value={editUserForm.full_name}
                                            onChange={e => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Rol Operativo</label>
                                        <select
                                            value={editUserForm.role}
                                            onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm appearance-none"
                                        >
                                            <option value="Entrenador">Entrenador</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Preparador Físico">Preparador Físico</option>
                                            <option value="Admin">Administrador (Admin)</option>
                                            <option value="Padres">Padre / Familiar</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Teléfono</label>
                                        <input
                                            value={editUserForm.phone}
                                            onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between bg-black/10 p-4 rounded-xl border border-white/5 mt-4">
                                        <span className="text-xs font-black uppercase tracking-wider dark:text-white">Habilitado y Activo</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={editUserForm.is_active}
                                                onChange={e => setEditUserForm({ ...editUserForm, is_active: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col h-full bg-[#0B1526]/50 p-6 rounded-[2rem] border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editUserForm.is_parent ? 'bg-[#5EE5F8] text-[#0B1526]' : 'bg-white/5 text-gray-500'}`}>
                                                    <Baby className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black dark:text-white uppercase tracking-wider">Es Familiar / Padre</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">Vincula con jugadores</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={editUserForm.is_parent}
                                                    onChange={e => setEditUserForm({ ...editUserForm, is_parent: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        {editUserForm.is_parent && (
                                            <div className="flex-1 flex flex-col min-h-[180px]">
                                                <div className="relative mb-4">
                                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                                    <input
                                                        value={childSearch}
                                                        onChange={e => setChildSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold dark:text-white"
                                                        placeholder="Buscar jugador..."
                                                    />
                                                    {filteredPlayers.length > 0 && (
                                                        <div className="absolute top-full left-0 w-full bg-[#1e293b] border border-white/10 rounded-xl mt-1 shadow-2xl z-20 overflow-hidden">
                                                            {filteredPlayers.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!editUserForm.selectedChildren.includes(p.id)) {
                                                                            setEditUserForm({
                                                                                ...editUserForm,
                                                                                selectedChildren: [...editUserForm.selectedChildren, p.id]
                                                                            })
                                                                        }
                                                                        setChildSearch('')
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 text-[11px] font-black text-gray-300 hover:bg-[#5EE5F8] hover:text-[#0B1526] transition-colors border-b border-white/5 last:border-0"
                                                                >
                                                                    {p.first_name} {p.last_name} {p.category ? `(${p.category})` : ''}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 overflow-y-auto space-y-2 max-h-[180px] bg-black/10 rounded-xl p-3 border border-white/5">
                                                    {editUserForm.selectedChildren.map(cid => {
                                                        const player = players.find(p => p.id === cid)
                                                        return (
                                                            <div key={cid} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                                                <span className="text-[10px] font-black dark:text-white uppercase tracking-wider">
                                                                    {player?.first_name} {player?.last_name}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditUserForm({
                                                                        ...editUserForm,
                                                                        selectedChildren: editUserForm.selectedChildren.filter(id => id !== cid)
                                                                    })}
                                                                    className="text-red-400 hover:text-red-500 p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                    {editUserForm.selectedChildren.length === 0 && (
                                                        <p className="text-[10px] text-gray-600 font-bold text-center mt-4 uppercase">
                                                            Elegí los hijos vinculados
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 rounded-xl font-black bg-liceo-primary hover:bg-liceo-primary/95 text-white dark:bg-[#5EE5F8] dark:hover:bg-[#4bc8da] dark:text-[#061B30] uppercase text-xs tracking-widest disabled:opacity-50 shadow-lg"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
