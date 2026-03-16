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
        // Try to find in pending_signups and create account
        const { data: pending } = await supabase
          .from('pending_signups')
          .select('*')
          .eq('email', customerEmail)
          .single()

        if (pending) {
          const { data: { user: newUser }, error: createErr } = await supabase.auth.admin.createUser({
            email: pending.email,
            password: pending.password,
            email_confirm: true,
            user_metadata: { username: pending.username, role: 'creator' },
          })
          if (createErr || !newUser) {
            results.push({ customer: customerEmail, status: `konto fejlede: ${createErr?.message}` })
            continue
          }
          await supabase.from('profiles').update({ username: pending.username, role: 'creator' }).eq('id', newUser.id)
          await supabase.from('pending_signups').delete().eq('id', pending.id)
          results.push({ customer: customerEmail, status: `✓ konto oprettet (@${pending.username}) — kører sync igen...` })
          // Re-fetch user for subscription upsert below
          const { data: { users: refetched } } = await supabase.auth.admin.listUsers()
          const createdUser = refetched.find(u => u.email === customerEmail)
          if (!createdUser) continue
          // Fall through with createdUser
          const metaTierFallback = (sub.metadata?.tier ?? '').toLowerCase()
          const priceIdFallback = sub.items.data[0]?.price?.id ?? ''
          const tierFallback = metaTierFallback.includes('pro') || priceIdFallback.toLowerCase().includes('pro') ? 'pro' : 'basic'
          const periodEndFallback = new Date((sub.items.data[0] as any)?.current_period_end ? (sub.items.data[0] as any).current_period_end * 1000 : sub.billing_cycle_anchor * 1000)
          await supabase.from('subscriptions').upsert({ creator_id: createdUser.id, stripe_subscription_id: sub.id, stripe_customer_id: customer.id, tier: tierFallback, status: sub.status, current_period_end: periodEndFallback.toISOString() }, { onConflict: 'stripe_subscription_id' })
        } else {
          results.push({ customer: customerEmail, status: '⚠ betalt i Stripe men ingen konto — opret manuelt' })
        }
        continue
      }

      // Determine tier from Stripe metadata or price name (use lowercase to match DB constraint)
      const metaTier = (sub.metadata?.tier ?? '').toLowerCase()
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const priceName = (sub.items.data[0]?.price?.nickname ?? '').toLowerCase()
      const tier = metaTier.includes('pro') || priceId.toLowerCase().includes('pro') || priceName.includes('pro') ? 'pro' : 'basic'

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
