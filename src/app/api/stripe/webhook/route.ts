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
  // In Stripe v20, current_period_end is on the first subscription item
  const firstItem = subscription.items?.data?.[0]
  if (firstItem && 'current_period_end' in firstItem) {
    return new Date((firstItem as any).current_period_end * 1000)
  }
  // Fallback: use billing_cycle_anchor + 30 days
  return new Date((subscription.billing_cycle_anchor + 30 * 24 * 60 * 60) * 1000)
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
    const { creator_id, tier } = session.metadata!

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const periodEnd = getSubscriptionPeriodEnd(subscription)

    await supabase.from('subscriptions').upsert({
      creator_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer as string,
      tier,
      status: subscription.status,
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'stripe_subscription_id' })
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
