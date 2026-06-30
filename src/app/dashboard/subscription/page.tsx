import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PLANS, stripe } from '@/lib/stripe'
import CheckoutButton from '@/components/CheckoutButton'
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('subscription')
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creators').select('*').eq('user_id', user.id).single()

  const { data: subscription } = creator ? await supabase
    .from('subscriptions')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .single() : { data: null }

  // Fetch invoice history from Stripe
  type InvoiceRow = {
    id: string
    date: string
    description: string
    amount: string
    status: string
    pdfUrl: string | null
  }
  let invoices: InvoiceRow[] = []
  if (subscription?.stripe_customer_id) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripe_customer_id,
        limit: 24,
      })
      invoices = stripeInvoices.data
        .filter((inv) => inv.amount_paid > 0 || inv.status === 'open')
        .map((inv) => ({
          id: inv.id,
          date: new Date(inv.created * 1000).toLocaleDateString('da-DK', {
            day: 'numeric', month: 'long', year: 'numeric',
          }),
          description: inv.lines?.data?.[0]?.description ?? inv.description ?? '—',
          amount: new Intl.NumberFormat('da-DK', { style: 'currency', currency: inv.currency.toUpperCase() }).format(inv.amount_paid / 100),
          status: inv.status ?? 'unknown',
          pdfUrl: inv.invoice_pdf ?? null,
        }))
    } catch {
      // Stripe not configured or customer not found — show empty list
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Dark header */}
      <div className="bg-[#08080f]">
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-700/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 pt-10 pb-10">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm font-medium mb-6 group transition-colors">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToDashboard')}
            </Link>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Creator</p>
            <h1 className="text-3xl font-black text-white tracking-tight">{t('title')}</h1>
            <p className="text-white/40 text-sm mt-1">{t('subtitle')}</p>
          </div>
        </div>
        <div className="h-14 bg-gradient-to-b from-[#08080f] to-white" />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Active subscription status */}
        {subscription && (
          <div className="mb-8 space-y-3">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">✅</div>
              <div className="flex-1">
                <div className="font-bold text-green-800">
                  {t('activeSubscription', { tier: 'Pro' })}
                </div>
                <div className="text-sm text-green-600 mt-0.5">
                  {t('renewsOn', { date: new Date(subscription.current_period_end).toLocaleDateString('da-DK') })}
                </div>
              </div>
            </div>
            <ManageSubscriptionButton />
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isActive = subscription?.tier === plan.name.toLowerCase()
            const isPro = plan.name.toLowerCase() === 'pro'
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  isActive ? 'border-indigo-500 shadow-lg shadow-indigo-50' : isPro ? 'border-purple-200' : 'border-gray-100'
                }`}
              >
                {isPro ? (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 pt-8 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-indigo-200 text-xs font-bold uppercase tracking-wide">{t('mostPopular')}</span>
                      {isActive && <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{t('currentPlan')}</span>}
                    </div>
                    <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                    <div className="mt-2">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-indigo-200"> {t('perMonth')}</span>
                    </div>
                    <p className="text-indigo-200 text-sm mt-2">{plan.description}</p>
                  </div>
                ) : (
                  <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wide">{t('standard')}</span>
                      {isActive && <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">{t('currentPlan')}</span>}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">{plan.name}</h2>
                    <div className="mt-2">
                      <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                      <span className="text-gray-500"> {t('perMonth')}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">{plan.description}</p>
                  </div>
                )}
                <div className="p-8">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPro ? 'text-purple-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isActive ? (
                    <CheckoutButton priceId={plan.priceId} tier="pro" creatorId={creator?.id ?? null} />
                  ) : (
                    <div className="text-center text-sm text-gray-400 bg-gray-50 py-3 rounded-xl font-medium">
                      {t('currentPlan')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment history — only shown if there's a subscription */}
        {subscription && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">{t('paymentHistory')}</h2>
              {invoices.length > 0 && (
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                  {invoices.length} {invoices.length === 1 ? 'betaling' : 'betalinger'}
                </span>
              )}
            </div>

            {invoices.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>{t('paymentDate')}</span>
                  <span className="text-right">{t('paymentAmount')}</span>
                  <span className="text-center">{t('paymentStatus')}</span>
                  <span className="text-right">{t('paymentReceipt')}</span>
                </div>

                {/* Rows */}
                {invoices.map((inv, i) => (
                  <div
                    key={inv.id}
                    className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 items-center ${i < invoices.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{inv.date}</div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{inv.description}</div>
                    </div>
                    <div className="text-sm font-bold text-gray-900 text-right">{inv.amount}</div>
                    <div className="flex justify-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-green-50 text-green-700'
                          : inv.status === 'open'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {inv.status === 'paid' ? t('paymentPaid') : inv.status === 'open' ? t('paymentOpen') : t('paymentVoid')}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      {inv.pdfUrl ? (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('paymentDownload')}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🧾</div>
                <p className="font-black text-gray-800 tracking-tight">{t('paymentNoHistory')}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
