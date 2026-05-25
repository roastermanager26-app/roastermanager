import Link from 'next/link'
import Image from 'next/image'
import { Shield, Users, Activity, ArrowRight, Zap, Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Si ya está logueado, lo mandamos al dashboard directamente
    if (user) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-[#040A14] selection:bg-[#5EE5F8] selection:text-[#040A14] text-white font-sans overflow-x-hidden">
            {/* Header Nav */}
            <header className="fixed top-0 w-full z-50 bg-[#0B1526]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#111f38] to-[#0B1526] flex items-center justify-center border border-[#5EE5F8]/30 shadow-[0_0_15px_rgba(94,229,248,0.25)]">
                            <Trophy className="w-5 h-5 text-[#5EE5F8] drop-shadow-[0_0_8px_rgba(94,229,248,0.5)]" />
                        </div>
                        <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Roaster<span className="text-[#5EE5F8]">Manager</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                            Ingresar
                        </Link>
                        <Link href="/register-club" className="hidden sm:flex items-center gap-2 bg-[#5EE5F8] hover:bg-[#4bc8da] text-[#061B30] px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(94,229,248,0.3)] hover:shadow-[0_0_30px_rgba(94,229,248,0.5)] hover:-translate-y-0.5">
                            Registrar mi Club <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 relative">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#5EE5F8]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
                
                <div className="max-w-4xl mx-auto text-center space-y-8 mt-12 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#5EE5F8] text-xs font-bold uppercase tracking-widest mb-4">
                        <Zap className="w-4 h-4" /> La plataforma N°1 para clubes de rugby
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                        Gestión deportiva <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5EE5F8] via-[#a3f3ff] to-white">
                            llevada al extremo
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        Administra planteles, organiza entrenamientos, haz seguimiento de destrezas, partes médicos y asistencias en una única plataforma unificada.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link href="/register-club" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5EE5F8] hover:bg-white text-[#061B30] px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_0_30px_rgba(94,229,248,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] hover:-translate-y-1">
                            Dar de Alta mi Club
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#111f38] hover:bg-[#1a2d4d] text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/10 transition-all">
                            Acceso Jugadores/Staff
                        </Link>
                    </div>
                </div>

                {/* Dashboard Preview / Mockup Area */}
                <div className="max-w-6xl mx-auto mt-24 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B1526]/50 backdrop-blur-sm p-4">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5EE5F8] to-transparent opacity-50"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        <div className="bg-[#111f38] p-8 rounded-2xl border border-white/5 space-y-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">Gestión de Planteles</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Control total sobre tus divisiones. Asistencias, armados de equipos y fichas médicas centralizadas.</p>
                        </div>
                        <div className="bg-[#111f38] p-8 rounded-2xl border border-white/5 space-y-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">Scouting & Destrezas</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Evalúa a tus jugadores con métricas precisas. Sigue la evolución de su tackle, pase, contacto y más.</p>
                        </div>
                        <div className="bg-[#111f38] p-8 rounded-2xl border border-white/5 space-y-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold">Planificación Táctica</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">Arma tus entrenamientos bloque por bloque. Incluye videos de YouTube o PDFs de tus jugadas.</p>
                        </div>
                    </div>
                </div>
            </main>
            
            <footer className="border-t border-white/10 mt-20 bg-[#0B1526]/50">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm font-medium">© 2026 RoasterManager. Todos los derechos reservados.</p>
                    <div className="flex gap-4">
                        <a href="#" className="text-gray-500 hover:text-white transition-colors"><Shield className="w-5 h-5" /></a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
