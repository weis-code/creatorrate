import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { validatePlatformUrls } from '@/lib/platformVerification'

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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'creator') {
      return NextResponse.json({ error: 'Kun creators kan overtage profiler' }, { status: 403 })
    }

    // Make sure user doesn't already have a creator profile
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

    const { error } = await adminSupabase
      .from('creators')
      .update({
        user_id: user.id,
        is_claimed: true,
        youtube_url: youtube_url || null,
        instagram_url: instagram_url || null,
        tiktok_url: tiktok_url || null,
      })
      .eq('slug', slug)
      .eq('is_claimed', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
