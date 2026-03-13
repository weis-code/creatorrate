import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId, tier, creatorId: incomingCreatorId } = await req.json()
    const admin = getSupabaseAdmin()

    let creatorId = incomingCreatorId

    // If no creator row yet, create a minimal one
    if (!creatorId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const baseSlug = (profile?.username || user.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Find a unique slug
      let slug = baseSlug
      let attempt = 1
      while (true) {
        const { data: existing } = await admin
          .from('creators')
          .select('id')
          .eq('slug', slug)
          .single()
        if (!existing) break
        slug = `${baseSlug}-${attempt++}`
      }

      const { data: newCreator, error: createError } = await admin
        .from('creators')
        .insert({
          user_id: user.id,
          display_name: profile?.username || 'Creator',
          slug,
          is_claimed: true,
        })
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      creatorId = newCreator.id
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/setup?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
      metadata: {
        creator_id: creatorId,
        tier,
        user_id: user.id,
      },
      customer_email: user.email,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
