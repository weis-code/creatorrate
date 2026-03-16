import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { validatePlatformUrls } from '@/lib/platformVerification'

function generateVerificationCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = 'creatorrate-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: Request) {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'creator') {
      return NextResponse.json({ error: 'Kun creators kan overtage profiler' }, { status: 403 })
    }

    // Check user doesn't already have a claimed creator profile
    const { data: existingCreator } = await adminSupabase
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingCreator) {
      return NextResponse.json({ error: 'Du har allerede en creator profil' }, { status: 400 })
    }

    const { slug, youtube_url, instagram_url, tiktok_url } = await req.json()

    const platformError = validatePlatformUrls(
      { youtube: youtube_url, instagram: instagram_url, tiktok: tiktok_url },
      slug
    )
    if (platformError) return NextResponse.json({ error: platformError }, { status: 400 })

    // Fetch creator to check it exists and isn't already claimed
    const { data: creator } = await adminSupabase
      .from('creators')
      .select('id, is_claimed, claim_status, display_name')
      .eq('slug', slug)
      .single()

    if (!creator) return NextResponse.json({ error: 'Profilen findes ikke' }, { status: 404 })
    if (creator.is_claimed) return NextResponse.json({ error: 'Profilen er allerede overtaget' }, { status: 400 })
    if (creator.claim_status === 'pending') {
      return NextResponse.json({ error: 'Der er allerede en anmodning under behandling for denne profil' }, { status: 400 })
    }

    const verificationCode = generateVerificationCode()

    // Store the claim request
    const { error } = await adminSupabase
      .from('creators')
      .update({
        verification_code: verificationCode,
        claim_requested_by: user.id,
        claim_status: 'pending',
        youtube_url: youtube_url || null,
        instagram_url: instagram_url || null,
        tiktok_url: tiktok_url || null,
      })
      .eq('id', creator.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify admin by email (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorrate.io'
    fetch(`${appUrl}/api/emails/claim-requested`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorName: creator.display_name,
        creatorSlug: slug,
        claimantUsername: profile.username,
        claimantUserId: user.id,
        verificationCode,
        youtubeUrl: youtube_url,
        instagramUrl: instagram_url,
        tiktokUrl: tiktok_url,
      }),
    }).catch(() => {})

    return NextResponse.json({ success: true, verificationCode })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
