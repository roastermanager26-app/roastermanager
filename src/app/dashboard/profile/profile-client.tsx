'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { STAFF_ROLES } from '@/utils/roles'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { useLang } from '@/components/lang-provider'
import {
    User, Phone, ShieldCheck, Mail, Save, Plus, X,
    Loader2, Users, Key, Check, Copy, Baby, Search, ShieldAlert, Eye, EyeOff,
    Edit2, Trash2
} from 'lucide-react'
import { activateUserAction, updatePasswordAction, updateUserAdminAction, deleteUserAdminAction } from './actions'


export default function ProfileClient({
    currentUser,
    currentProfile,
    allProfiles,
    allPlayers,
    allLinkages
}: {
    currentUser: any,
    currentProfile: any,
    allProfiles: any[],
    allPlayers: any[],
    allLinkages: any[]
}) {
    const supabase = createClient()
    const { t } = useLang()
    const searchParams = useSearchParams()
    const router = useRouter()
    const forceReset = currentProfile?.force_password_change === true

    // My Profile State
    const [profileData, setProfileData] = useState({
        full_name: currentProfile?.full_name || '',
        phone: currentProfile?.phone || '',
        role: currentProfile?.role || 'Staff'
    })
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' })
    const [isSavingMyProfile, setIsSavingMyProfile] = useState(false)
    const [isSavingPass, setIsSavingPass] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showOldPassword, setShowOldPassword] = useState(false)

    useEffect(() => {
        if (showPassword) {
            const timer = setTimeout(() => setShowPassword(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [showPassword])

    useEffect(() => {
        if (showConfirmPassword) {
            const timer = setTimeout(() => setShowConfirmPassword(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [showConfirmPassword])

    // Staff Management State
    const [staff, setStaff] = useState(allProfiles)
    const [linkages, setLinkages] = useState(allLinkages)
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            if (currentProfile?.tenant_id) {
                const { data } = await supabase
                    .from('categories')
                    .select('id, name')
                    .eq('tenant_id', currentProfile.tenant_id)
                    .order('name', { ascending: true })
                if (data) {
                    setCategories(data)
                }
            }
        }
        fetchCategories()
    }, [currentProfile?.tenant_id, supabase])

    // UI Modals State
    const [isCreatingStaff, setIsCreatingStaff] = useState(false)
    const [isActivatingUser, setIsActivatingUser] = useState<any>(null) // Profile being activated
    const [isEditingUser, setIsEditingUser] = useState<any>(null) // User being edited
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null) // ID of member being deleted

    // Form States
    const [newStaff, setNewStaff] = useState({ full_name: '', role: 'Staff', phone: '', is_parent: false, category_id: '' })
    const [activateForm, setActivateForm] = useState({ email: '', role: 'Staff', password: '', is_parent: false, category_id: '', selectedChildren: [] as string[] })

    const [isSavingStaff, setIsSavingStaff] = useState(false)
    const [isActivating, setIsActivating] = useState(false)
    const [tempPassword, setTempPassword] = useState('')
    const [copied, setCopied] = useState(false)
    const [childSearch, setChildSearch] = useState('')

    // Roles permitidos
    const roles = [...STAFF_ROLES, 'Padres']

    // Admin check
    const isAdmin = currentProfile?.role === 'Admin'

    // Filtering players for search
    const filteredPlayers = useMemo(() => {
        if (!childSearch) return []
        return allPlayers.filter(p =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(childSearch.toLowerCase())
        ).slice(0, 5)
    }, [childSearch, allPlayers])

    const handleUpdateMyProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingMyProfile(true)

        const { error } = await supabase.from('profiles').update(profileData).eq('id', currentUser.id)

        if (!error) {
            showSuccessToast('Perfil Actualizado', 'Tus datos fueron guardados correctamente.')
        } else {
            showErrorToast('Error', 'No se pudieron actualizar tus datos.')
        }
        setIsSavingMyProfile(false)
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.old === passwordData.new) {
            showErrorToast('Error', 'La nueva contraseña no puede ser igual a la actual')
            return
        }
        if (passwordData.new !== passwordData.confirm) {
            showErrorToast('Error', 'Las contraseñas no coinciden')
            return
        }

        const hasMinLen = passwordData.new.length >= 8
        const hasUpper = /[A-Z]/.test(passwordData.new)
        const hasNumber = /[0-9]/.test(passwordData.new)
        const hasSpecial = /[^A-Za-z0-9]/.test(passwordData.new)

        if (!hasMinLen || !hasUpper || !hasNumber || !hasSpecial) {
            showErrorToast('Error', 'La contraseña no cumple con todas las reglas de seguridad')
            return
        }
        if (passwordData.new.length < 6) {
            showErrorToast('Error', 'La contraseña debe tener al menos 6 caracteres')
            return
        }

        setIsSavingPass(true)
        const result = await updatePasswordAction(passwordData.old, passwordData.new)
        if (result.success) {
            showSuccessToast('¡Listo!', 'Contraseña actualizada correctamente.')
            if (forceReset) router.push('/dashboard/staff')
        } else {
            showErrorToast('Error', result.error || 'No se pudo cambiar la contraseña')
        }
        setIsSavingPass(false)
    }

    const handleCreateMockStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingStaff(true)

        const payload = {
            full_name: newStaff.full_name,
            role: newStaff.role,
            phone: newStaff.phone || null,
            is_parent: newStaff.is_parent,
            tenant_id: currentProfile?.tenant_id,
            category_id: newStaff.category_id || null
        }
        const { data, error } = await supabase.from('profiles').insert([payload]).select()

        if (!error && data) {
            setStaff([data[0], ...staff])
            setIsCreatingStaff(false)
            setNewStaff({ full_name: '', role: 'Staff', phone: '', is_parent: false, category_id: '' })
            showSuccessToast('Staff Añadido', 'El perfil mock fue creado exitosamente.')
        } else {
            showErrorToast('Error', error?.message || 'No se pudo crear el perfil.')
        }
        setIsSavingStaff(false)
    }

    const generateTempPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#'
        let pass = ''
        for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length))
        // Ensure at least one uppercase and one symbol for basic policy
        pass += 'A!'
        setActivateForm({ ...activateForm, password: pass })
    }

    const handleActivateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsActivating(true)

        const result = await activateUserAction({
            mockId: isActivatingUser.id,
            email: activateForm.email,
            password: activateForm.password,
            role: activateForm.role,
            full_name: isActivatingUser.full_name,
            phone: isActivatingUser.phone,
            is_parent: activateForm.is_parent,
            category_id: isActivatingUser.category_id || null,
            selectedChildren: activateForm.selectedChildren
        })

        if (result.error) {
            showErrorToast('Error de Activación', result.error)
            setIsActivating(false)
            return
        }

        showSuccessToast('Usuario Activado', 'El perfil ahora es un usuario real con acceso.')
        setTempPassword(activateForm.password)

        // El estado local se actualizará con un refresh o manualmente
        setStaff(prev => prev.filter(p => p.id !== isActivatingUser.id).concat([{
            id: 'new-id', // Placeholder, el revalidatePath del servidor refrescará la data
            full_name: isActivatingUser.full_name,
            role: activateForm.role,
            is_parent: activateForm.is_parent,
            is_active: true
        } as any]))

        setIsActivating(false)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`RugbyLink M13\nAcceso Activado:\nEmail: ${activateForm.email}\nClave: ${tempPassword}\n\nRecordá cambiar tu clave al ingresar.`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsEditing(true)
        const result = await updateUserAdminAction({
            userId: isEditingUser.id,
            full_name: isEditingUser.full_name,
            role: isEditingUser.role,
            phone: isEditingUser.phone,
            is_parent: isEditingUser.is_parent,
            is_active: isEditingUser.is_active,
            category_id: isEditingUser.category_id || null
        })

        if (!result.error) {
            showSuccessToast('Usuario Actualizado', 'Los cambios fueron guardados.')
            setStaff(prev => prev.map(m => m.id === isEditingUser.id ? { ...m, ...isEditingUser } : m))
            setIsEditingUser(null)
        } else {
            showErrorToast('Error', result.error)
        }
        setIsEditing(false)
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('¿Estás seguro que deseás borrar este perfil? Esta acción es irreversible.')) return
        setIsDeleting(userId)
        const result = await deleteUserAdminAction(userId)
        if (!result.error) {
            showSuccessToast('Usuario Eliminado', 'El perfil ha sido removido.')
            setStaff(prev => prev.filter(m => m.id !== userId))
        } else {
            showErrorToast('Error', result.error)
        }
        setIsDeleting(null)
    }


    return (
        <div className="p-6 md:p-10 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-liceo-primary/30 via-background to-background dark:from-liceo-primary/20 dark:via-background dark:to-background text-foreground transition-colors space-y-8 max-w-7xl mx-auto font-sans">

            <header className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-liceo-primary to-liceo-accent dark:from-white dark:to-liceo-accent mb-2">
                    {t.profilePage.title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                    {t.profilePage.subtitle}
                </p>
            </header>

            {forceReset && (
                <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Cambio de Contraseña Obligatorio</h3>
                        <p className="text-sm font-medium mt-1 leading-relaxed opacity-80">Por seguridad, debes establecer una contraseña propia en tu primer ingreso al sistema antes de poder continuar.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* MY PROFILE */}
                <div className={`bg-white dark:bg-[#0B1526] rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200 dark:border-white/10 flex flex-col h-full ${forceReset && 'opacity-50 pointer-events-none'}`}>
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3 dark:text-white">
                        <User className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" />
                        {t.profilePage.myPersonalData}
                    </h2>

                    <div className="flex items-center gap-4 mb-8 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="w-16 h-16 bg-liceo-primary text-white dark:bg-[#5EE5F8] dark:text-[#061B30] rounded-full flex items-center justify-center font-black text-2xl uppercase shadow-md">
                            {profileData.full_name ? profileData.full_name.charAt(0) : currentUser.email?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {t.profilePage.accessEmail}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{currentUser.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateMyProfile} className="space-y-5 flex-1 flex flex-col">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">{t.profilePage.fullName}</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    required
                                    value={profileData.full_name}
                                    onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white transition-all shadow-sm"
                                    placeholder="Ej: Mario Gómez"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">{t.profilePage.phoneMsg}</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={profileData.phone}
                                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white transition-all shadow-sm"
                                    placeholder="+54 9 11 1234 5678"
                                />
                            </div>
                        </div>

                        <div className="mt-auto pt-8">
                            <button type="submit" disabled={isSavingMyProfile} className="w-full py-4 rounded-xl font-black tracking-widest bg-liceo-primary hover:bg-liceo-primary/90 text-white dark:bg-[#5EE5F8] dark:hover:bg-[#4bc8da] dark:text-[#061B30] flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-xl disabled:opacity-50 uppercase text-xs">
                                {isSavingMyProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {t.profilePage.saveMyData}
                            </button>
                        </div>
                    </form>
                </div>

                {/* CHANGE PASSWORD */}
                <div className={`${forceReset ? 'lg:col-span-2 max-w-2xl mx-auto w-full' : ''} bg-white dark:bg-[#0B1526] rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200 dark:border-white/10 flex flex-col h-full`}>
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3 dark:text-white">
                        <Key className="w-6 h-6 text-liceo-gold" />
                        Seguridad y Acceso
                    </h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-4 flex-1 flex flex-col">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Contraseña Actual / Temporal</label>
                            <div className="relative">
                                <input type={showOldPassword ? 'text' : 'password'} required value={passwordData.old} onChange={e => setPasswordData({ ...passwordData, old: e.target.value })} className="w-full pl-5 pr-12 py-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#001224] font-bold text-sm dark:text-white focus:ring-2 focus:ring-liceo-gold outline-none transition-all" />
                                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-liceo-gold transition-colors">
                                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nueva Contraseña</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} required value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })} className="w-full pl-5 pr-12 py-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#001224] font-bold text-sm dark:text-white focus:ring-2 focus:ring-liceo-gold outline-none transition-all" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-liceo-gold transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Reglas de contraseña */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2 border border-gray-100 dark:border-white/10">
                            <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-3">Requisitos de Seguridad</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                                <div className={`flex items-center gap-2 ${passwordData.new.length >= 8 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <Check className={`w-3.5 h-3.5 ${passwordData.new.length >= 8 ? 'opacity-100' : 'opacity-30'}`} /> Mínimo 8 caracteres
                                </div>
                                <div className={`flex items-center gap-2 ${/[A-Z]/.test(passwordData.new) ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <Check className={`w-3.5 h-3.5 ${/[A-Z]/.test(passwordData.new) ? 'opacity-100' : 'opacity-30'}`} /> 1 Letra Mayúscula
                                </div>
                                <div className={`flex items-center gap-2 ${/[0-9]/.test(passwordData.new) ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <Check className={`w-3.5 h-3.5 ${/[0-9]/.test(passwordData.new) ? 'opacity-100' : 'opacity-30'}`} /> Al menos 1 Número
                                </div>
                                <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(passwordData.new) ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <Check className={`w-3.5 h-3.5 ${/[^A-Za-z0-9]/.test(passwordData.new) ? 'opacity-100' : 'opacity-30'}`} /> 1 Carácter Especial (*,#,!)
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <input type={showConfirmPassword ? 'text' : 'password'} required value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} className="w-full pl-5 pr-12 py-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#001224] font-bold text-sm dark:text-white focus:ring-2 focus:ring-liceo-gold outline-none transition-all" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-liceo-gold transition-colors">
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="mt-auto pt-6">
                            <button type="submit" disabled={isSavingPass} className="w-full py-4 bg-liceo-gold hover:bg-yellow-400 text-[#0B1526] rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg disabled:opacity-50">
                                {isSavingPass ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (forceReset ? 'Establecer y Entrar' : 'Actualizar Password')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* STAFF MANAGEMENT */}
                {!forceReset && (
                    <div className="bg-white/80 dark:bg-[#0B1526]/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200 dark:border-white/10 flex flex-col h-full relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black flex items-center gap-3 dark:text-white">
                                <Users className="w-6 h-6 text-liceo-accent dark:text-[#5EE5F8]" />
                                {t.profilePage.staffDir}
                            </h2>
                            {isAdmin && (
                                <button onClick={() => setIsCreatingStaff(true)} className="bg-liceo-primary/10 hover:bg-liceo-primary/20 dark:bg-[#5EE5F8]/10 dark:hover:bg-[#5EE5F8]/20 p-2.5 rounded-xl transition-colors border border-liceo-primary/10 dark:border-[#5EE5F8]/20">
                                    <Plus className="w-5 h-5 text-liceo-primary dark:text-[#5EE5F8]" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 border-t border-gray-100 dark:border-white/5 pt-6">
                            {staff.map(member => {
                                const isMock = !member.is_active
                                const isCurrentUser = member.id === currentUser.id
                                const childrenCount = linkages.filter(l => l.parent_profile_id === member.id).length
                                const catName = categories.find(c => c.id === member.category_id)?.name

                                return (
                                    <div key={member.id} className="bg-white dark:bg-[#102035] p-5 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col gap-4 shadow-sm group hover:border-liceo-primary/30 dark:hover:border-[#5EE5F8]/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner ${isMock ? 'bg-gray-100 dark:bg-white/5 text-gray-400' : 'bg-liceo-primary/10 dark:bg-[#5EE5F8]/10 text-liceo-primary dark:text-[#5EE5F8]'}`}>
                                                {member.full_name ? member.full_name.charAt(0) : 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight">{member.full_name || 'Sin Nombre'}</h3>
                                                    {isCurrentUser && (
                                                        <span className="text-[8px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">TÚ</span>
                                                    )}
                                                    {isMock && (
                                                        <span className="text-[8px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">MOCK</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                    {member.role || 'Staff'} {catName ? `• ${catName}` : '• General'}
                                                </p>
                                            </div>

                                            {isAdmin && (
                                                <div className="flex gap-1.5">
                                                    {isMock && (
                                                        <button
                                                            onClick={() => setIsActivatingUser(member)}
                                                            className="bg-liceo-gold hover:bg-yellow-400 text-[#0B1526] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-all"
                                                        >
                                                            Activar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setIsEditingUser(member)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-liceo-primary dark:hover:text-[#5EE5F8]"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(member.id)}
                                                        disabled={isDeleting === member.id || isCurrentUser}
                                                        className={`p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors ${isCurrentUser ? 'opacity-20 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}`}
                                                        title={isCurrentUser ? "No podés borrarte a vos mismo" : "Eliminar"}
                                                    >
                                                        {isDeleting === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sub-info: Hijos linked */}
                                        {member.is_parent && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 dark:bg-[#5EE5F8]/5 rounded-xl border border-sky-100 dark:border-[#5EE5F8]/10 w-fit">
                                                <Baby className="w-3.5 h-3.5 text-sky-600 dark:text-[#5EE5F8]" />
                                                <span className="text-[10px] font-black text-sky-700 dark:text-[#5EE5F8] uppercase tracking-wider">
                                                    Padre: {childrenCount} Hijos vinculados
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIVATION MODAL */}
            {isActivatingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        {tempPassword ? (
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">¡Usuario Activado!</h2>
                                <p className="text-gray-400 font-medium">Copiá y enviá estos datos de acceso al usuario por WhatsApp:</p>

                                <div className="bg-[#0B1526] p-6 rounded-3xl border border-white/5 text-left relative group">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Email</p>
                                            <p className="text-white font-bold">{activateForm.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Clave Temporal</p>
                                            <p className="text-liceo-gold font-mono font-black text-xl tracking-widest">{tempPassword}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                                    >
                                        {copied ? <Check className="w-6 h-6 text-emerald-500" /> : <Copy className="w-6 h-6 text-gray-400" />}
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsActivatingUser(null)
                                        setTempPassword('')
                                        setActivateForm({ email: '', role: 'Staff', password: '', is_parent: false, category_id: '', selectedChildren: [] })
                                    }}
                                    className="w-full py-4 bg-liceo-primary dark:bg-white text-white dark:text-[#0B1526] rounded-2xl font-black uppercase tracking-widest shadow-lg"
                                >
                                    Cerrar y Continuar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleActivateUser} className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                            <Key className="w-6 h-6 text-liceo-gold" />
                                            Activar Acceso Real
                                        </h2>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">{isActivatingUser.full_name}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActivatingUser(null)}
                                        className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl transition-all"
                                    >
                                        <X className="w-5 h-5 dark:text-white" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Email de Acceso</label>
                                            <input
                                                required
                                                type="email"
                                                value={activateForm.email}
                                                onChange={e => setActivateForm({ ...activateForm, email: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-gold font-bold dark:text-white text-sm"
                                                placeholder="coach@liceo.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Rol en el Sistema</label>
                                            <select
                                                value={activateForm.role}
                                                onChange={e => setActivateForm({ ...activateForm, role: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-gold font-bold dark:text-white text-sm appearance-none"
                                            >
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Contraseña Temporal</label>
                                            <div className="flex gap-2">
                                                <input
                                                    required
                                                    value={activateForm.password}
                                                    onChange={e => setActivateForm({ ...activateForm, password: e.target.value })}
                                                    className="flex-1 px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-gold font-mono font-bold dark:text-white text-sm tracking-widest"
                                                    placeholder="LiceoM13!"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generateTempPassword}
                                                    className="p-4 bg-liceo-gold/10 hover:bg-liceo-gold/20 text-liceo-gold rounded-2xl border border-liceo-gold/20 transition-all shadow-sm"
                                                    title="Generar Aleatoria"
                                                >
                                                    <Key className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-col h-full bg-[#0B1526]/50 p-6 rounded-[2rem] border border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activateForm.is_parent ? 'bg-[#5EE5F8] text-[#0B1526]' : 'bg-white/5 text-gray-500'}`}>
                                                        <Baby className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black dark:text-white uppercase tracking-wider">Perfil Padre</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Vincular a Jugadores</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={activateForm.is_parent}
                                                        onChange={e => setActivateForm({ ...activateForm, is_parent: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>

                                            {activateForm.is_parent && (
                                                <div className="flex-1 flex flex-col min-h-[150px]">
                                                    <div className="relative mb-4">
                                                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                                        <input
                                                            value={childSearch}
                                                            onChange={e => setChildSearch(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold dark:text-white"
                                                            placeholder="Buscar hijo..."
                                                        />
                                                        {filteredPlayers.length > 0 && (
                                                            <div className="absolute top-full left-0 w-full bg-[#1e293b] border border-white/10 rounded-xl mt-1 shadow-2xl z-20 overflow-hidden">
                                                                {filteredPlayers.map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (!activateForm.selectedChildren.includes(p.id)) {
                                                                                setActivateForm({ ...activateForm, selectedChildren: [...activateForm.selectedChildren, p.id] })
                                                                            }
                                                                            setChildSearch('')
                                                                        }}
                                                                        className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-300 hover:bg-liceo-gold hover:text-[#0B1526] transition-colors border-b border-white/5 last:border-0"
                                                                    >
                                                                        {p.first_name} {p.last_name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[120px]">
                                                        {activateForm.selectedChildren.map(cid => {
                                                            const player = allPlayers.find(p => p.id === cid)
                                                            return (
                                                                <div key={cid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                                                    <span className="text-[10px] font-black dark:text-white uppercase tracking-wider">{player?.first_name} {player?.last_name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActivateForm({ ...activateForm, selectedChildren: activateForm.selectedChildren.filter(id => id !== cid) })}
                                                                        className="text-red-400 hover:text-red-500 p-1"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                        {activateForm.selectedChildren.length === 0 && (
                                                            <p className="text-[10px] text-gray-600 font-bold text-center mt-4">Sin hijos seleccionados</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isActivating}
                                    className="w-full mt-8 py-5 rounded-2xl font-black bg-liceo-gold text-[#0B1526] hover:bg-yellow-400 flex justify-center items-center gap-2 shadow-xl shadow-yellow-500/10 tracking-[0.2em] transition-all disabled:opacity-50 text-xs"
                                >
                                    {isActivating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'ACTIVAR CUENTA AHORA'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {isEditingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <form onSubmit={handleEditUser} className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                        <Edit2 className="w-6 h-6 text-liceo-primary dark:text-[#5EE5F8]" />
                                        Editar Perfil
                                    </h2>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">ID: {isEditingUser.id.substring(0, 8)}...</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingUser(null)}
                                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <X className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">{t.profilePage.fullName}</label>
                                    <input
                                        required
                                        value={isEditingUser.full_name}
                                        onChange={e => setIsEditingUser({ ...isEditingUser, full_name: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Rol / Cargo</label>
                                        <select
                                            value={isEditingUser.role}
                                            onChange={e => setIsEditingUser({ ...isEditingUser, role: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm appearance-none"
                                        >
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Teléfono</label>
                                        <input
                                            value={isEditingUser.phone || ''}
                                            onChange={e => setIsEditingUser({ ...isEditingUser, phone: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Categoría / División (Opcional)</label>
                                    <select
                                        value={isEditingUser.category_id || ''}
                                        onChange={e => setIsEditingUser({ ...isEditingUser, category_id: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm cursor-pointer"
                                    >
                                        <option value="" className="bg-white dark:bg-[#0B1526] text-gray-900 dark:text-white">General / Todas las Categorías</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#0B1526] text-gray-900 dark:text-white">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-between bg-[#0B1526]/50 p-6 rounded-[2rem] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditingUser.is_parent ? 'bg-[#5EE5F8] text-[#0B1526]' : 'bg-white/5 text-gray-500'}`}>
                                            <Baby className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black dark:text-white uppercase tracking-wider">Perfil Padre</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isEditingUser.is_parent}
                                            onChange={e => setIsEditingUser({ ...isEditingUser, is_parent: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between bg-[#0B1526]/50 p-6 rounded-[2rem] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditingUser.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black dark:text-white uppercase tracking-wider">Estado Activo</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isEditingUser.is_active}
                                            onChange={e => setIsEditingUser({ ...isEditingUser, is_active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isEditing}
                                className="w-full mt-8 py-5 rounded-2xl font-black bg-liceo-primary dark:bg-white text-white dark:text-[#0B1526] hover:opacity-90 flex justify-center items-center gap-2 shadow-xl tracking-[0.2em] transition-all disabled:opacity-50 text-xs"
                            >
                                {isEditing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'GUARDAR CAMBIOS'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE MOCK STAFF MODAL */}
            {isCreatingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1526]/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#111f38] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Nuevo Perfil Mock</h2>
                            <button onClick={() => setIsCreatingStaff(false)} className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-white/10 rounded-full transition-all">
                                <X className="w-4 h-4 dark:text-white" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateMockStaff} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">{t.profilePage.fullName}</label>
                                <input required value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Rol / Cargo</label>
                                <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm appearance-none">
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Categoría / División (Opcional)</label>
                                <select
                                    value={newStaff.category_id}
                                    onChange={e => setNewStaff({ ...newStaff, category_id: e.target.value })}
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1526] focus:outline-none focus:ring-2 focus:ring-liceo-primary font-bold dark:text-white text-sm cursor-pointer"
                                >
                                    <option value="" className="bg-white dark:bg-[#0B1526] text-gray-900 dark:text-white">General / Todas las Categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#0B1526] text-gray-900 dark:text-white">
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label className="flex-1 text-xs font-bold dark:text-gray-400 uppercase tracking-wider">¿Es Padre?</label>
                                <input
                                    type="checkbox"
                                    checked={newStaff.is_parent}
                                    onChange={e => setNewStaff({ ...newStaff, is_parent: e.target.checked })}
                                    className="w-5 h-5 rounded accent-liceo-gold"
                                />
                            </div>
                            <button type="submit" disabled={isSavingStaff} className="w-full mt-4 py-4 rounded-xl font-black bg-liceo-primary text-white dark:bg-[#5EE5F8] dark:text-[#061B30] hover:opacity-90 flex justify-center items-center gap-2 shadow-xl tracking-widest text-xs uppercase transition-all">
                                {isSavingStaff ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Perfil'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
