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

  // Fetch all subscriptions from Stripe
  const stripeSubscriptions = await stripe.subscriptions.list({
    limit: 100,
    status: 'all',
    expand: ['data.customer'],
  })

  // Fetch all Supabase users once (case-insensitive lookup)
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers()

  for (const sub of stripeSubscriptions.data) {
    try {
      const customer = sub.customer as any
      const customerEmail = customer?.email as string | undefined

      if (!customerEmail) {
        results.push({ customer: customer?.id ?? '?', status: 'ingen email' })
        continue
      }

      // Case-insensitive match
      const user = allUsers.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase())

      if (!user) {
        results.push({ customer: customerEmail, status: '⚠ ingen Supabase-konto fundet' })
        continue
      }

      // Determine tier
      const metaTier = (sub.metadata?.tier ?? '').toLowerCase()
      const priceId = sub.items.data[0]?.price?.id ?? ''
      const priceName = (sub.items.data[0]?.price?.nickname ?? '').toLowerCase()
      const tier = metaTier.includes('pro') || priceId.toLowerCase().includes('pro') || priceName.includes('pro') ? 'pro' : 'basic'

      const periodEnd = new Date(
        (sub.items.data[0] as any)?.current_period_end
          ? (sub.items.data[0] as any).current_period_end * 1000
          : sub.billing_cycle_anchor * 1000
      )

      // Ensure profile is creator
      await supabase.from('profiles').update({ role: 'creator' }).eq('id', user.id)

      // Check if creator row exists (subscriptions FK references creators.id)
      const { data: creatorRow } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!creatorRow) {
        // Create placeholder creators row so subscription FK is satisfied
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        const username = profile?.username ?? customerEmail.split('@')[0] ?? 'creator'
        const slug = username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const { error: insertErr } = await supabase.from('creators').insert({
          id: user.id,
          user_id: user.id,
          display_name: username,
          slug,
        })
        if (insertErr) {
          results.push({ customer: customerEmail, status: `creators-row fejl: ${insertErr.message}` })
          continue
        }
      }

      // Upsert subscription row
      const creatorId = creatorRow?.id ?? user.id
      const { error } = await supabase.from('subscriptions').upsert({
        creator_id: creatorId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customer.id,
        tier,
        status: sub.status,
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'stripe_subscription_id' })

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
