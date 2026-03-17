import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  return NextResponse.json({ ready: !!user })
}
