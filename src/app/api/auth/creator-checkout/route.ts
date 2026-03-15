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

  // Check email not already registered (via profiles or pending signups)
  const [{ data: emailInAuth }, { data: emailPending }] = await Promise.all([
    supabase.from('profiles').select('id').eq('email', email).maybeSingle(),
    supabase.from('pending_signups').select('id').eq('email', email).maybeSingle(),
  ])

  if (emailInAuth) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }
  if (emailPending) {
    return NextResponse.json({ error: 'A signup with this email is already in progress' }, { status: 400 })
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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?role=creator`,
    customer_email: email,
    metadata: {
      pending_id: pending.id,
      tier,
    },
  })

  return NextResponse.json({ url: session.url })
}
