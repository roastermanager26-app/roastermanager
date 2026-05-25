'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Loader2, ArrowRight, Building, User, Mail, Lock, Link as LinkIcon } from 'lucide-react'
import { registerNewClub } from './actions'

export default function RegisterClubPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
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

            <div className="max-w-xl w-full bg-[#0B1526]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5EE5F8]/10 rounded-full blur-3xl -m-32 transition-opacity opacity-50"></div>

                <div className="text-center relative z-10 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#111f38] flex items-center justify-center border border-white/10 mx-auto mb-6 shadow-inner">
                        <Shield className="w-8 h-8 text-[#5EE5F8]" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-3">
                        Registra tu <span className="text-[#5EE5F8]">Club</span>
                    </h1>
                    <p className="text-gray-400 font-medium tracking-wide text-sm">
                        Crea un entorno aislado y seguro para gestionar los planteles y el staff de tu institución.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-bold text-center mb-6 relative z-10">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5EE5F8] hover:bg-[#4bc8da] text-[#061B30] py-4 rounded-xl font-black text-lg transition-all shadow-[0_0_20px_rgba(94,229,248,0.2)] hover:shadow-[0_0_30px_rgba(94,229,248,0.4)] flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>Crear mi Entorno <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8 relative z-10">
                    Al crear el club, te conviertes en su administrador y podrás invitar a otros entrenadores y jugadores.
                </p>
            </div>
        </div>
    )
}
