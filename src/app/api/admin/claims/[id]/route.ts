import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  return adminAuth && adminAuth === adminEmail
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action, reason } = await req.json()

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch the pending claim
  const { data: creator, error: fetchError } = await adminSupabase
    .from('creators')
    .select('id, display_name, slug, claim_requested_by, claim_status')
    .eq('id', id)
    .single()

  if (fetchError || !creator) {
    return NextResponse.json({ error: 'Profil ikke fundet' }, { status: 404 })
  }

  if (creator.claim_status !== 'pending') {
    return NextResponse.json({ error: 'Ingen afventende anmodning' }, { status: 400 })
  }

  // Fetch claimant info for email
  const { data: claimant } = await adminSupabase
    .from('profiles')
    .select('email, username')
    .eq('id', creator.claim_requested_by)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorrate.io'

  if (action === 'approve') {
    // Set user_id, is_claimed = true, clear claim fields
    const { error } = await adminSupabase
      .from('creators')
      .update({
        user_id: creator.claim_requested_by,
        is_claimed: true,
        claim_status: null,
        claim_requested_by: null,
        verification_code: null,
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Email the creator (fire-and-forget)
    if (claimant?.email) {
      fetch(`${appUrl}/api/emails/claim-resolved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: claimant.email,
          username: claimant.username,
          creatorName: creator.display_name,
          creatorSlug: creator.slug,
          approved: true,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    // Clear claim fields, set status to rejected
    const { error } = await adminSupabase
      .from('creators')
      .update({
        claim_status: 'rejected',
        claim_requested_by: null,
        verification_code: null,
        youtube_url: null,
        instagram_url: null,
        tiktok_url: null,
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Email the creator (fire-and-forget)
    if (claimant?.email) {
      fetch(`${appUrl}/api/emails/claim-resolved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: claimant.email,
          username: claimant.username,
          creatorName: creator.display_name,
          creatorSlug: creator.slug,
          approved: false,
          reason,
        }),
      }).catch(() => {})
    }

    // Reset status to null after a moment so they can try again
    // (rejected is just to prevent immediate re-attempt, not permanent)
    setTimeout(async () => {
      await adminSupabase
        .from('creators')
        .update({ claim_status: null })
        .eq('id', id)
    }, 5000)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ugyldig handling' }, { status: 400 })
}
