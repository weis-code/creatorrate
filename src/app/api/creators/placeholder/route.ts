import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { handle } = await req.json()
    if (!handle) return NextResponse.json({ error: 'Handle mangler' }, { status: 400 })

    const slug = handle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const display_name = handle

    // Return existing if already there
    const { data: existing } = await adminSupabase
      .from('creators')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existing) return NextResponse.json({ slug: existing.slug })

    const { data, error } = await adminSupabase
      .from('creators')
      .insert({ user_id: null, display_name, slug, is_claimed: false })
      .select('slug')
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ slug: data.slug })
  } catch (e: any) {
    console.error('Caught error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
