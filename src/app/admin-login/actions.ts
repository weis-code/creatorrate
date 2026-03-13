'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function adminLogin(formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase()
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()

  if (email && email === adminEmail) {
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/admin',
    })
    redirect('/admin')
  }

  redirect('/admin-login?error=1')
}
