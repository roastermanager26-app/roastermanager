import Link from 'next/link'
import { Mail, Trophy } from 'lucide-react'

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-[#0B1526] flex items-center justify-center p-4 selection:bg-[#5EE5F8] selection:text-[#0B1526] text-white">
            <div className="max-w-md w-full bg-[#111f38] rounded-3xl shadow-2xl p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#5EE5F8]/5 rounded-full blur-3xl -my-32 transition-opacity opacity-50"></div>

                <div className="text-center flex flex-col items-center relative z-10 mb-8">
                    <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center shadow-lg border border-[#5EE5F8]/30 mb-4">
                        <Trophy className="w-8 h-8 text-[#5EE5F8] drop-shadow-[0_0_8px_rgba(94,229,248,0.5)]" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 uppercase">
                        Solicitar Acceso
                    </h1>
                    <p className="text-gray-400 font-medium tracking-wide">La creación de cuentas es administrada por el Manager.</p>
                </div>


                <div className="space-y-4 relative z-10">
                    <div className="bg-gray-50/5 border border-white/10 rounded-2xl p-6 text-center shadow-inner">
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            Para obtener una cuenta y acceder al sistema, por favor contactá directamente al administrador enviando un correo con tus datos.
                        </p>

                        <a
                            href="mailto:giraldezblack@gmail.com?subject=Solicitud%20de%20acceso%20-%20Roaster%20Manager&body=Hola!%0A%0AQuiero%20solicitar%20acceso%20al%20sistema.%0A%0AMis%20datos%20son:%0A-%20Nombre:%20%0A-%20Rol%2FParentesco:%20"
                            className="w-full bg-liceo-gold text-[#0B1526] py-4 rounded-xl font-black tracking-widest hover:bg-yellow-400 transition-all shadow-lg flex items-center justify-center gap-3 uppercase text-sm"
                        >
                            <Mail className="w-5 h-5" />
                            Enviar Correo al Manager
                        </a>
                    </div>
                </div>

                <div className="text-center text-sm text-gray-400 mt-8 relative z-10 space-y-2">
                    <p>
                        ¿Ya tenés una cuenta?{' '}
                        <Link href="/login" className="text-liceo-gold font-bold hover:underline transition-colors uppercase tracking-wider text-[10px]">
                            Ingresá acá
                        </Link>
                    </p>
                    <p className="pt-4 border-t border-white/5">
                        ¿Sos el administrador de un nuevo club?{' '}
                        <Link href="/register-club" className="text-[#5EE5F8] font-bold hover:underline transition-colors uppercase tracking-wider text-[10px]">
                            Registrá tu Club
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
