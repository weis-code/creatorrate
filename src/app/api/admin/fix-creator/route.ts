import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/admin/fix-creator
// Body: { email: string }
// Finds the user and forces role = 'creator'
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  if (adminAuth?.value !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Find user in auth
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    return NextResponse.json({ error: `Ingen bruger fundet med email: ${email}` }, { status: 404 })
  }

  // Check pending_signups for username
  const { data: pending } = await supabase
    .from('pending_signups')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  const username = pending?.username
    ?? user.user_metadata?.username
    ?? email.split('@')[0]

  // Update profile role and username
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'creator', username })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: `Profil-fejl: ${updateError.message}` }, { status: 500 })
  }

  // Check if subscription exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('creator_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    user_id: user.id,
    email: user.email,
    username,
    role: 'creator',
    has_subscription: !!existingSub,
    note: existingSub
      ? 'Profil rettet. Abonnement findes allerede.'
      : 'Profil rettet. OBS: Intet abonnement fundet — tjek Stripe webhook.',
  })
}
