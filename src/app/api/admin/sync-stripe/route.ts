import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  if (adminAuth?.value !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: { customer: string; status: string }[] = []

  // Fetch all active/past_due subscriptions from Stripe
  const stripeSubscriptions = await stripe.subscriptions.list({
    limit: 100,
    status: 'all',
    expand: ['data.customer'],
  })

  for (const sub of stripeSubscriptions.data) {
    try {
      const customer = sub.customer as any
      const customerEmail = customer?.email

      if (!customerEmail) {
        results.push({ customer: customer?.id ?? '?', status: 'ingen email' })
        continue
      }

      // Find user in Supabase by email
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const user = users.find(u => u.email === customerEmail)

      if (!user) {
        results.push({ customer: customerEmail, status: 'bruger ikke fundet' })
        continue
      }

      // Determine tier from price
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const tier = priceId.toLowerCase().includes('pro') ? 'PRO' : 'BASIC'

      const periodEnd = new Date(
        (sub.items.data[0] as any)?.current_period_end
          ? (sub.items.data[0] as any).current_period_end * 1000
          : sub.billing_cycle_anchor * 1000
      )

      // Upsert subscription row
      const { error } = await supabase.from('subscriptions').upsert({
        creator_id: user.id,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customer.id,
        tier,
        status: sub.status,
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'stripe_subscription_id' })

      // Also ensure profile is set to creator
      await supabase.from('profiles').update({ role: 'creator' }).eq('id', user.id)

      results.push({
        customer: customerEmail,
        status: error ? `fejl: ${error.message}` : `✓ synkroniseret (${tier}, ${sub.status})`,
      })
    } catch (e: any) {
      results.push({ customer: String(sub.id), status: `exception: ${e.message}` })
    }
  }

  return NextResponse.json({ total: stripeSubscriptions.data.length, results })
}
