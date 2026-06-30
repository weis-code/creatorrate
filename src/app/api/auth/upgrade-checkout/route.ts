import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const tier = 'PRO'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('username, role').eq('id', user.id).single()
    if (profile?.role === 'creator') {
      return NextResponse.json({ error: 'Du er allerede en creator' }, { status: 400 })
    }

    const priceId = process.env.STRIPE_PRICE_ID_PRO!

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.dk'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: user.email,
      metadata: {
        upgrade_user_id: user.id,
        upgrade_username: profile?.username ?? '',
        tier,
      },
      success_url: `${appUrl}/signup/success?email=${encodeURIComponent(user.email!)}`,
      cancel_url: `${appUrl}/profile`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[upgrade-checkout] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
