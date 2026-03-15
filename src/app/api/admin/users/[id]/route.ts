import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()

  if (!adminAuth || adminAuth !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  // Delete user from auth (cascades to profiles via trigger)
  const { error } = await supabase.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
