import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  const firstItem = subscription.items?.data?.[0]
  if (firstItem && 'current_period_end' in firstItem) {
    return new Date((firstItem as any).current_period_end * 1000)
  }
  return new Date((subscription.billing_cycle_anchor + 30 * 24 * 60 * 60) * 1000)
}

async function handleCreatorSignup(supabase: ReturnType<typeof getSupabaseAdmin>, pendingId: string, tier: string, stripeCustomerId: string, stripeSubscriptionId: string, periodEnd: Date) {
  // Fetch pending signup
  const { data: pending, error } = await supabase
    .from('pending_signups')
    .select('*')
    .eq('id', pendingId)
    .single()

  if (error || !pending) {
    console.error('Pending signup not found:', pendingId)
    return
  }

  // Create Supabase user
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: pending.email,
    password: pending.password,
    email_confirm: true,
    user_metadata: { username: pending.username, role: 'creator' },
  })

  if (createError || !user) {
    console.error('Failed to create user:', createError)
    return
  }

  // Create profile row
  await supabase.from('profiles').insert({
    id: user.id,
    username: pending.username,
    role: 'creator',
  })

  // Create subscription row
  await supabase.from('subscriptions').insert({
    creator_id: user.id,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    tier,
    status: 'active',
    current_period_end: periodEnd.toISOString(),
  })

  // Send welcome email via Resend — account is already confirmed, so they can log in immediately
  if (process.env.RESEND_API_KEY) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'noreply@creatorrate.io',
        to: pending.email,
        subject: 'Velkommen til CreatorRate 🎉',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">CreatorRate</h1>
            </div>
            <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
              <h2 style="color: #111827; margin-top: 0;">Hej ${pending.username}! 👋</h2>
              <p style="color: #6b7280;">Din betaling er gennemført og din konto er klar. Log ind nu for at opsætte din creator profil.</p>
              <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Din email:</strong> ${pending.email}</p>
                <p style="margin: 8px 0 0; color: #374151; font-size: 14px;"><strong>Dit brugernavn:</strong> @${pending.username}</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}"
                   style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Log ind og kom i gang →
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">Brug din email og det kodeord du valgte ved oprettelsen.</p>
            </div>
          </div>
        `,
      }),
    }).catch(console.error)
  }

  // Delete pending signup
  await supabase.from('pending_signups').delete().eq('id', pendingId)
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { pending_id, tier, creator_id } = session.metadata ?? {}

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const periodEnd = getSubscriptionPeriodEnd(subscription)

    if (pending_id) {
      // New creator signup flow: create user from pending signup
      await handleCreatorSignup(
        supabase,
        pending_id,
        tier,
        session.customer as string,
        subscription.id,
        periodEnd
      )
    } else if (creator_id) {
      // Existing creator upgrading/choosing plan
      await supabase.from('subscriptions').upsert({
        creator_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer as string,
        tier,
        status: subscription.status,
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const periodEnd = getSubscriptionPeriodEnd(subscription)

    await supabase.from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: periodEnd.toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ received: true })
}
