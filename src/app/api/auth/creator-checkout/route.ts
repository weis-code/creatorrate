import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
  const { email, username, password, tier } = await req.json()

  if (!email || !username || !password || !tier) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Check username not taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
  }

  // Check email not already registered
  const { data: emailPending } = await supabase
    .from('pending_signups')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (emailPending) {
    return NextResponse.json({ error: 'Der er allerede en igangværende tilmelding med denne email' }, { status: 400 })
  }

  // Check auth.users directly via service role (avoids slow listUsers pagination)
  const { data: authUsers } = await supabase
    .rpc('check_email_in_auth', { check_email: email.toLowerCase() })

  if (authUsers) {
    return NextResponse.json({ error: 'Der eksisterer allerede en konto med denne email' }, { status: 400 })
  }

  // Store pending signup (deleted after webhook creates user)
  const { data: pending, error: pendingError } = await supabase
    .from('pending_signups')
    .insert({ email, username, password, tier })
    .select('id')
    .single()

  if (pendingError || !pending) {
    return NextResponse.json({ error: 'Failed to store signup' }, { status: 500 })
  }

  // Create Stripe checkout session
  const priceId = tier === 'BASIC'
    ? process.env.STRIPE_PRICE_ID_BASIC!
    : process.env.STRIPE_PRICE_ID_PRO!

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 30,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?email=${encodeURIComponent(email)}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?role=creator`,
    customer_email: email,
    metadata: {
      pending_id: pending.id,
      tier,
    },
  })

  return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[creator-checkout] error:', err)
    return NextResponse.json({ error: err.message || 'Noget gik galt' }, { status: 500 })
  }
}
