import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StarRating from '@/components/StarRating'
import { getTranslations } from 'next-intl/server'
import SetupNudgeModal from './SetupNudgeModal'
import DashboardReviews from '@/components/DashboardReviews'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('dashboard')

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'creator') redirect('/')

  const { data: creator } = await supabase.from('creators').select('*').eq('user_id', user.id).single()
  if (!creator) redirect('/dashboard/subscription')

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`*, viewer:profiles(username), reply:review_replies(*)`)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .single()

  const pendingReplies = reviews?.filter((r: any) => !r.reply && !r.is_disputed) ?? []
  const disputedReviews = reviews?.filter((r: any) => r.is_disputed) ?? []

  const stats = [
    { value: creator.review_count, label: t('reviews'), icon: '📝', color: 'from-indigo-500 to-indigo-600' },
    { value: creator.average_rating > 0 ? creator.average_rating.toFixed(1) : '–', label: t('average'), icon: '⭐', color: 'from-yellow-400 to-orange-500', extra: creator.average_rating > 0 ? <StarRating rating={creator.average_rating} size="sm" /> : null },
    { value: pendingReplies.length, label: t('pendingReplies'), icon: '💬', color: 'from-purple-500 to-purple-600' },
    { value: disputedReviews.length, label: t('disputed'), icon: '⚠️', color: 'from-orange-400 to-orange-500' },
  ]

  const hasOnePlatformLink = !!(creator.youtube_url || creator.instagram_url || creator.tiktok_url)
  const profileIncomplete = !creator.bio || !hasOnePlatformLink

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Setup nudge modal — shown until profile is complete */}
      {profileIncomplete && <SetupNudgeModal />}
      {/* Top banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">{t('title')}</p>
            <h1 className="text-2xl font-bold text-white">{t('greeting', { name: creator.display_name })}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/creators/${creator.slug}`}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {t('viewProfile')}
            </Link>
            <Link
              href="/dashboard/settings"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {t('settings')}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(({ value, label, icon, color, extra }: any) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white text-lg mb-3 shadow-sm`}>
                {icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {extra && <div className="mt-0.5">{extra}</div>}
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Subscription status */}
        <div className={`rounded-2xl p-5 mb-6 shadow-sm border ${subscription ? 'bg-green-50 border-green-100' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${subscription ? 'bg-green-100' : 'bg-indigo-100'}`}>
                {subscription ? '✅' : '🔓'}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {subscription
                    ? t('activeSubscription', { tier: subscription.tier === 'pro' ? 'Pro' : 'Basic' })
                    : t('noSubscription')}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {subscription
                    ? t('renewsOn', { date: new Date(subscription.current_period_end).toLocaleDateString('da-DK') })
                    : t('buySubscriptionMsg')}
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/subscription"
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${subscription ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-sm'}`}
            >
              {subscription ? t('manage') : t('buySubscription')}
            </Link>
          </div>
        </div>

        {/* Reviews */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('recentReviews')}</h2>
          {reviews && reviews.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{t('total', { count: reviews.length })}</span>
          )}
        </div>

        {reviews && reviews.length > 0 ? (
          <DashboardReviews
            reviews={reviews}
            currentUserId={user.id}
            creatorUserId={creator.user_id}
            creatorName={creator.display_name}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">{t('noReviews')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noReviewsSub')}</p>
            <Link
              href={`/creators/${creator.slug}`}
              className="inline-block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
            >
              {t('viewYourProfile')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
