import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  if (adminAuth?.value !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, password } = await req.json()
  if (!userId || !password) {
    return NextResponse.json({ error: 'userId og password er påkrævet' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password skal være mindst 6 tegn' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(userId, { password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
