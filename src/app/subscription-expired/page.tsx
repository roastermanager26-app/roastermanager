'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Lock, Mail, ArrowRight, LogOut, Loader2 } from 'lucide-react'

export default function SubscriptionExpiredPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [tenant, setTenant] = useState<any>(null)

    useEffect(() => {
        const checkTrial = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single()

            if (profile?.tenant_id) {
                const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('name, trial_ends_at, subscription_tier')
                    .eq('id', profile.tenant_id)
                    .single()
                setTenant(tenantData)
            }
            setLoading(false)
        }

        checkTrial()
    }, [router, supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#040A14] flex flex-col items-center justify-center p-4 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-[#5EE5F8]" />
            </div>
        )
    }

    const expirationDate = tenant?.trial_ends_at 
        ? new Date(tenant.trial_ends_at).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        : 'Desconocida'

    return (
        <div className="min-h-screen bg-[#040A14] flex flex-col items-center justify-center p-4 selection:bg-[#5EE5F8] selection:text-[#040A14] text-white">
            <div className="max-w-xl w-full bg-[#0B1526]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/10 relative overflow-hidden group text-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -m-32 transition-opacity opacity-50"></div>
                
                <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-8 shadow-inner animate-pulse">
                    <Lock className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white mb-4">
                    Período de Prueba <span className="text-red-400">Finalizado</span>
                </h1>

                <p className="text-gray-400 font-medium tracking-wide text-sm leading-relaxed mb-6">
                    RoasterManager ofrece una prueba gratuita de 30 días para evaluar la plataforma con tu staff. 
                    El período de prueba de tu club <span className="text-white font-bold">{tenant?.name || 'la institución'}</span> ha expirado y el entorno ha sido suspendido temporalmente.
                </p>

                {tenant && (
                    <div className="bg-[#111f38]/60 border border-white/5 rounded-2xl p-5 mb-8 text-left space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-500 font-semibold">Club:</span>
                            <span className="text-white font-bold">{tenant.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-500 font-semibold">Plan de Registro:</span>
                            <span className="text-[#5EE5F8] font-black uppercase tracking-wider text-xs">Plan {tenant.subscription_tier}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-semibold">Fecha de Expiración:</span>
                            <span className="text-red-400 font-bold">{expirationDate}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <a
                        href="mailto:marianoez.gonzalez@gmail.com?subject=Renovacion de Suscripcion - RoasterManager"
                        className="w-full bg-[#5EE5F8] hover:bg-[#4bc8da] text-[#061B30] py-4 rounded-xl font-black text-lg transition-all shadow-[0_0_20px_rgba(94,229,248,0.2)] hover:shadow-[0_0_30px_rgba(94,229,248,0.4)] flex items-center justify-center gap-2"
                    >
                        <Mail className="w-5 h-5" /> Contactar a Soporte <ArrowRight className="w-5 h-5" />
                    </a>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-[#111f38] hover:bg-[#1a2d4d] text-white py-3 rounded-xl font-bold text-sm border border-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-8">
                    Para reactivar tu cuenta, solicita al administrador del club que actualice el plan de suscripción en el sistema.
                </p>
            </div>
        </div>
    )
}
