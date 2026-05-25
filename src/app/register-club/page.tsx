'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, ArrowRight, Building, User, Mail, Lock, Link as LinkIcon, Check, Trophy, Sparkles, Zap } from 'lucide-react'
import { registerNewClub } from './actions'

export default function RegisterClubPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Basic' | 'Premium'>('Free')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSelectPlan = (plan: 'Free' | 'Basic' | 'Premium') => {
        setSelectedPlan(plan)
        setStep(2)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.append('subscriptionPlan', selectedPlan)

        const result = await registerNewClub(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else if (result?.success) {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-[#040A14] flex flex-col items-center justify-center p-4 selection:bg-[#5EE5F8] selection:text-[#040A14] text-white">
            <Link href="/" className="absolute top-8 left-8 text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                ← Volver al inicio
            </Link>

            <div className="max-w-4xl w-full bg-[#0B1526]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5EE5F8]/10 rounded-full blur-3xl -m-32 transition-opacity opacity-50"></div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${step === 1 ? 'bg-[#5EE5F8] text-[#061B30] shadow-[0_0_15px_rgba(94,229,248,0.4)]' : 'bg-[#111f38] text-gray-400'}`}>
                        1. Elegir Plan
                    </div>
                    <div className="w-12 h-[2px] bg-white/5"></div>
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${step === 2 ? 'bg-[#5EE5F8] text-[#061B30] shadow-[0_0_15px_rgba(94,229,248,0.4)]' : 'bg-[#111f38] text-gray-400'}`}>
                        2. Datos del Club
                    </div>
                </div>

                <div className="text-center relative z-10 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#111f38] flex items-center justify-center border border-white/10 mx-auto mb-6 shadow-inner">
                        <Shield className="w-8 h-8 text-[#5EE5F8]" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-3">
                        Registra tu <span className="text-[#5EE5F8]">Club</span>
                    </h1>
                    <p className="text-gray-400 font-medium tracking-wide text-sm max-w-xl mx-auto">
                        Crea un entorno aislado y seguro para gestionar los planteles y el staff de tu institución.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-bold text-center mb-6 relative z-10">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-8 animate-fade-in relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Free Trial Card */}
                            <div className="bg-[#111f38]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col justify-between hover:border-[#5EE5F8]/30 transition-all group/card">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black tracking-widest text-[#5EE5F8] uppercase">PRUEBA</span>
                                        <Zap className="w-5 h-5 text-[#5EE5F8]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Free Trial</h3>
                                        <p className="text-gray-400 text-xs mt-1">Ideal para probar la plataforma.</p>
                                    </div>
                                    <div className="text-2xl font-black">$0 <span className="text-xs font-normal text-gray-400">/ 30 días</span></div>
                                    <ul className="space-y-2 text-xs text-gray-300 border-t border-white/5 pt-4">
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Hasta 15 usuarios</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Control de asistencia</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Armado manual de equipos</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Histórico de destrezas</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => handleSelectPlan('Free')}
                                    className="w-full mt-6 bg-[#111f38] hover:bg-[#5EE5F8] hover:text-[#061B30] text-[#5EE5F8] py-3 rounded-xl font-bold text-sm transition-all border border-[#5EE5F8]/20 flex items-center justify-center gap-2"
                                >
                                    Elegir Free <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Basic Card */}
                            <div className="bg-[#111f38]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col justify-between hover:border-[#5EE5F8]/30 transition-all group/card relative">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black tracking-widest text-[#5EE5F8] uppercase">INDIVIDUAL</span>
                                        <Trophy className="w-5 h-5 text-[#5EE5F8]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Plan Basic</h3>
                                        <p className="text-gray-400 text-xs mt-1">Para entrenadores de una división.</p>
                                    </div>
                                    <div className="text-2xl font-black">$15 <span className="text-xs font-normal text-gray-400">/ mes</span></div>
                                    <ul className="space-y-2 text-xs text-gray-300 border-t border-white/5 pt-4">
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Hasta 20 usuarios</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Reporte de presentismo</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> 1 Categoría/División</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Importación masiva (Excel)</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => handleSelectPlan('Basic')}
                                    className="w-full mt-6 bg-[#111f38] hover:bg-[#5EE5F8] hover:text-[#061B30] text-[#5EE5F8] py-3 rounded-xl font-bold text-sm transition-all border border-[#5EE5F8]/20 flex items-center justify-center gap-2"
                                >
                                    Elegir Basic <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Premium Card */}
                            <div className="bg-[#111f38]/90 backdrop-blur-md rounded-2xl border border-[#5EE5F8]/30 shadow-[0_0_30px_rgba(94,229,248,0.15)] p-6 flex flex-col justify-between hover:border-[#5EE5F8]/50 transition-all group/card relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-[#5EE5F8] text-[#061B30] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Recomendado
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black tracking-widest text-[#5EE5F8] uppercase">CLUB COMPLETO</span>
                                        <Sparkles className="w-5 h-5 text-[#5EE5F8]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Plan Premium</h3>
                                        <p className="text-gray-400 text-xs mt-1">El entorno definitivo para tu club.</p>
                                    </div>
                                    <div className="text-2xl font-black">$45 <span className="text-xs font-normal text-gray-400">/ mes</span></div>
                                    <ul className="space-y-2 text-xs text-gray-300 border-t border-[#5EE5F8]/10 pt-4">
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Hasta 100 usuarios</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Múltiples Divisiones</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Armado de Equipos con AI</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Scouting & Skills Radar</li>
                                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#5EE5F8]" /> Soporte prioritario</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => handleSelectPlan('Premium')}
                                    className="w-full mt-6 bg-[#5EE5F8] hover:bg-white text-[#061B30] py-3 rounded-xl font-black text-sm transition-all shadow-[0_0_15px_rgba(94,229,248,0.2)] flex items-center justify-center gap-2"
                                >
                                    Elegir Premium <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-fade-in">
                        <div className="flex items-center justify-between bg-[#111f38]/60 border border-white/5 rounded-xl px-5 py-3 text-xs mb-2">
                            <span className="font-bold text-gray-400">Plan Seleccionado:</span>
                            <span className="font-black text-[#5EE5F8] uppercase flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" /> Plan {selectedPlan} {selectedPlan !== 'Free' && '(Prueba de 30 días Gratis)'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[#5EE5F8] text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-2">1. Datos de la Institución</h3>
                            
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="clubName"
                                    type="text"
                                    required
                                    placeholder="Nombre Oficial del Club"
                                    className="block w-full pl-12 pr-4 py-4 bg-[#111f38] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EE5F8] focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="logoUrl"
                                    type="url"
                                    placeholder="URL del Escudo/Logo (Opcional)"
                                    className="block w-full pl-12 pr-4 py-4 bg-[#111f38] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EE5F8] focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-[#5EE5F8] text-xs font-bold uppercase tracking-widest border-b border-white/10 pb-2">2. Administrador Principal</h3>
                            
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="fullName"
                                    type="text"
                                    required
                                    placeholder="Tu Nombre Completo"
                                    className="block w-full pl-12 pr-4 py-4 bg-[#111f38] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EE5F8] focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Correo Electrónico (Tu acceso)"
                                    className="block w-full pl-12 pr-4 py-4 bg-[#111f38] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EE5F8] focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Contraseña Segura"
                                    className="block w-full pl-12 pr-4 py-4 bg-[#111f38] border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5EE5F8] focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-1/3 bg-[#111f38] hover:bg-[#1a2d4d] text-white py-4 rounded-xl font-bold text-sm border border-white/10 transition-all"
                            >
                                Volver
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-2/3 bg-[#5EE5F8] hover:bg-[#4bc8da] text-[#061B30] py-4 rounded-xl font-black text-lg transition-all shadow-[0_0_20px_rgba(94,229,248,0.2)] hover:shadow-[0_0_30px_rgba(94,229,248,0.4)] flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>Crear mi Entorno <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                <p className="text-center text-sm text-gray-500 mt-8 relative z-10">
                    Al crear el club, te conviertes en su administrador y podrás invitar a otros entrenadores y jugadores.
                </p>
            </div>
        </div>
    )
}
