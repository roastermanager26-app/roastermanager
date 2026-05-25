'use client'

import { useActionState, useState, useEffect } from 'react'
import { login } from '../actions'
import { signInWithGoogle } from '../social-auth'
import Link from 'next/link'
import { Users, ShieldCheck, Eye, EyeOff, Trophy } from 'lucide-react'

export default function LoginPage() {
    const [entryPoint, setEntryPoint] = useState<'staff' | 'parent'>('staff')
    const [showPassword, setShowPassword] = useState(false)

    // Auto-hide password after 3 seconds
    useEffect(() => {
        if (showPassword) {
            const timer = setTimeout(() => setShowPassword(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [showPassword])

    const [state, formAction, pending] = useActionState(
        async (prevState: any, formData: FormData) => {
            formData.append('entryPoint', entryPoint)
            return await login(formData)
        },
        null
    )

    return (
        <div className="min-h-screen bg-[#0B1526] flex items-center justify-center p-4 selection:bg-[#5EE5F8] selection:text-[#0B1526] text-white font-sans">
            <div className="max-w-md w-full bg-[#111f38] rounded-3xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#5EE5F8]/5 rounded-full blur-3xl -my-32 transition-opacity opacity-50"></div>

                <div className="text-center flex flex-col items-center relative z-10 mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center shadow-lg border border-[#5EE5F8]/30 mb-4">
                        <Trophy className="w-8 h-8 text-[#5EE5F8] drop-shadow-[0_0_8px_rgba(94,229,248,0.5)]" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1 uppercase">
                        Roaster<span className="text-[#5EE5F8]">Manager</span>
                    </h1>
                    <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase opacity-70">Acceso al Sistema</p>
                </div>


                {/* Dual Toggle Selector */}
                <div className="flex p-1 bg-[#0B1526] rounded-2xl mb-8 relative z-10 border border-white/5">
                    <button
                        onClick={() => setEntryPoint('staff')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${entryPoint === 'staff' ? 'bg-liceo-gold text-[#0B1526] shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Login Staff
                    </button>
                    <button
                        onClick={() => setEntryPoint('parent')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${entryPoint === 'parent' ? 'bg-[#5EE5F8] text-[#0B1526] shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Users className="w-4 h-4" />
                        Acceso Familia
                    </button>
                </div>

                {state?.error && (
                    <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm text-center font-bold relative z-10 mb-6 border border-red-500/20 animate-in fade-in zoom-in duration-300">
                        {state.error}
                    </div>
                )}

                <div className="space-y-4 relative z-10">
                    <button
                        onClick={signInWithGoogle}
                        type="button"
                        className="w-full bg-[#1e293b] border border-white/10 text-white py-3 rounded-xl font-bold hover:bg-[#27354f] hover:border-liceo-gold/50 flex items-center justify-center gap-3 transition-all shadow-sm group"
                    >
                        <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 border-t border-white/10"></div>
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">O EMAIL</span>
                        <div className="flex-1 border-t border-white/10"></div>
                    </div>
                </div>

                <form action={formAction} className="space-y-4 relative z-10 mt-2">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest opacity-60">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-[#0B1526] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-liceo-gold dark:focus:ring-[#5EE5F8] focus:border-transparent outline-none transition-all placeholder:text-gray-600 font-medium text-sm"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest opacity-60">Contraseña</label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="w-full px-4 py-3 bg-[#0B1526] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-liceo-gold dark:focus:ring-[#5EE5F8] focus:border-transparent outline-none transition-all placeholder:text-gray-600 font-medium text-sm pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={pending}
                        className={`w-full py-4 rounded-xl font-black tracking-[0.2em] transition-all disabled:opacity-50 mt-4 shadow-xl uppercase text-xs ${entryPoint === 'staff' ? 'bg-liceo-gold text-[#0B1526] hover:bg-yellow-400 shadow-yellow-500/10' : 'bg-[#5EE5F8] text-[#0B1526] hover:opacity-90 shadow-cyan-500/10'}`}
                    >
                        {pending ? 'Procesando...' : 'ENTRAR'}
                    </button>
                </form>

                <div className="text-center text-[10px] font-bold text-gray-500 mt-8 relative z-10 uppercase tracking-wider">
                    ¿No tenés una cuenta?{' '}
                    <Link href="/signup" className="text-liceo-gold hover:underline transition-colors ml-1">
                        Contactá a tu Manager
                    </Link>
                </div>
            </div>
        </div>
    )
}
