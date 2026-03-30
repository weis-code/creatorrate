import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  return adminAuth === adminEmail
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed = ['display_name', 'bio', 'slug', 'youtube_url', 'instagram_url', 'tiktok_url', 'avatar_url', 'category']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const supabase = createAdminClient()
  const { error } = await supabase.from('creators').update(update).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
