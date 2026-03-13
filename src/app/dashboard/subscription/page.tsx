import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PLANS } from '@/lib/stripe'
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
  if (!creator) redirect('/dashboard/setup')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium mb-4 group transition-colors">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToDashboard')}
          </Link>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-indigo-200 text-sm mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-16">
        {subscription && (
          <div className="mb-6 space-y-3">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">✅</div>
              <div className="flex-1">
                <div className="font-semibold text-green-800">
                  {t('activeSubscription', { tier: subscription.tier === 'pro' ? 'Pro' : 'Basic' })}
                </div>
                <div className="text-sm text-green-700 mt-0.5">
                  {t('renewsOn', { date: new Date(subscription.current_period_end).toLocaleDateString('da-DK') })}
                </div>
              </div>
            </div>
            <ManageSubscriptionButton />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(PLANS).map(([key, plan], i) => {
            const isActive = subscription?.tier === plan.name.toLowerCase()
            const isPro = plan.name.toLowerCase() === 'pro'
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
                  isActive ? 'border-indigo-500 shadow-indigo-100' : isPro ? 'border-purple-200' : 'border-gray-100'
                }`}
              >
                {/* Card top */}
                {isPro ? (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 pt-8 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wide">{t('mostPopular')}</span>
                      {isActive && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{t('currentPlan')}</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-indigo-200"> {t('perMonth')}</span>
                    </div>
                    <p className="text-indigo-200 text-sm mt-2">{plan.description}</p>
                  </div>
                ) : (
                  <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{t('standard')}</span>
                      {isActive && <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{t('currentPlan')}</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
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
                  {!isActive && (
                    <CheckoutButton priceId={plan.priceId} tier={plan.name.toLowerCase() as 'basic' | 'pro'} creatorId={creator.id} />
                  )}
                  {isActive && (
                    <div className="text-center text-sm text-gray-400 bg-gray-50 py-3 rounded-xl">
                      {t('currentPlan')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
