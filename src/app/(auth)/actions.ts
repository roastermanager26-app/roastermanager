'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Por favor completá todos los campos.' }
    }

    const supabase = await createClient()

    const entryPoint = formData.get('entryPoint') as string

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Credenciales inválidas.' }
    }

    const sessionToken = crypto.randomUUID()

    // Guardar token en metadata de Auth (evita alterar database de Profiles)
    await supabase.auth.updateUser({ data: { current_session_token: sessionToken } })

    // Set cookie para validación de concurrentes
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('roaster_session_token', sessionToken, {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 1 day
    })

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_parent')
        .eq('id', authData?.user?.id)
        .single()

    // Interceptar e inyectar Superadmin si el correo coincide
    if (email === 'marianoez.gonzalez@gmail.com' || profile?.role === 'Superadmin') {
        if (email === 'marianoez.gonzalez@gmail.com' && profile?.role !== 'Superadmin') {
            const adminClient = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_SECRET!
            )
            await adminClient
                .from('profiles')
                .update({ role: 'Superadmin' })
                .eq('id', authData?.user?.id)
        }
        redirect('/superadmin')
    }

    console.log("=== LOGIN DEBUG ===")
    console.log("User ID:", authData?.user?.id)
    console.log("Profile Data:", profile)
    console.log("Profile Error:", profileError)

    const isStaffRole = profile?.role === 'Admin' || profile?.role === 'Administrador' || profile?.role === 'Entrenador' || profile?.role === 'Staff' || profile?.role === 'Manager'

    console.log("isStaffRole:", isStaffRole)
    console.log("entryPoint:", entryPoint)
    console.log("====================")

    if (entryPoint === 'staff' && !isStaffRole) {
        // Si intenta entrar como staff pero NO tiene rol de staff
        return { error: 'Esta cuenta no tiene permisos de Staff. Por favor, selecciona "Soy Familiar" para ingresar.' }
    }

    if (entryPoint === 'parent' && !profile?.is_parent) {
        // Si intenta entrar como padre pero no tiene marcado is_parent
        return { error: 'Esta cuenta no tiene acceso Familiar asignado. Ingresa como Staff.' }
    }

    if (entryPoint === 'parent') {
        redirect('/dashboard/parent')
    } else {
        redirect('/dashboard/staff')
    }
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    if (!email || !password || !fullName) {
        return { error: 'Por favor completá todos los campos.' }
    }

    // Password Validation
    if (password.length < 8) {
        return { error: 'La contraseña debe tener al menos 8 caracteres.' }
    }
    if (!/[A-Z]/.test(password)) {
        return { error: 'La contraseña debe incluir al menos una mayúscula.' }
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { error: 'La contraseña debe incluir al menos un carácter especial.' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/dashboard')
}
