import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StarRating from '@/components/StarRating'
import ReviewCard from '@/components/ReviewCard'
import WriteReviewButton from '@/components/WriteReviewButton'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

const YoutubeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)
const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)
const TiktokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
)
const GlobeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const t = await getTranslations('creatorDetail')

  const { data: { user } } = await supabase.auth.getUser()

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!creator) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`*, viewer:profiles(username, avatar_url), reply:review_replies(*)`)
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })

  let userReview = null
  let userProfile = null
  if (user) {
    const { data: review } = await supabase.from('reviews').select('id').eq('creator_id', creator.id).eq('viewer_id', user.id).single()
    userReview = review
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    userProfile = profile
  }

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews?.filter((r) => r.rating === star).length ?? 0,
    percent: reviews?.length ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  const socialLinks = [
    { url: creator.youtube_url, label: t('youtube'), icon: <YoutubeIcon />, color: 'text-red-500 bg-red-50 hover:bg-red-100 border-red-100' },
    { url: creator.instagram_url, label: t('instagram'), icon: <InstagramIcon />, color: 'text-pink-500 bg-pink-50 hover:bg-pink-100 border-pink-100' },
    { url: creator.tiktok_url, label: t('tiktok'), icon: <TiktokIcon />, color: 'text-gray-800 bg-gray-50 hover:bg-gray-100 border-gray-200' },
    { url: creator.website_url, label: t('website'), icon: <GlobeIcon />, color: 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100 border-indigo-100' },
  ].filter((l) => l.url)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Claim banner */}
        {!creator.is_claimed && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">{t('claimTitle', { name: creator.display_name })}</p>
                <p className="text-amber-700 text-xs mt-0.5">{t('claimSubtitle')}</p>
              </div>
            </div>
            <a
              href={`/creators/${slug}/claim`}
              className="flex-shrink-0 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              {t('claimBtn')}
            </a>
          </div>
        )}

        {/* Creator header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {/* Gradient top */}
          <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600" />

          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-12 mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center ring-4 ring-white shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {creator.display_name[0].toUpperCase()}
                </span>
              </div>
              {!userReview && userProfile?.role !== 'creator' && (
                <WriteReviewButton creatorId={creator.id} creatorSlug={slug} />
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{creator.display_name}</h1>
                {creator.category && (
                  <span className="inline-block text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-1 font-medium">
                    {creator.category}
                  </span>
                )}
                {creator.bio && <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-lg">{creator.bio}</p>}
              </div>
            </div>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socialLinks.map(({ url, label, icon, color }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 ${color} border text-xs font-medium px-3 py-1.5 rounded-lg transition-colors`}
                  >
                    {icon}
                    {label}
                  </a>
                ))}
              </div>
            )}

            {/* Rating overview */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-8 items-start">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">
                  {creator.average_rating > 0 ? creator.average_rating.toFixed(1) : '–'}
                </div>
                <StarRating rating={creator.average_rating} size="md" />
                <div className="text-xs text-gray-400 mt-1">{creator.review_count} {t('reviews')}</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingCounts.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                    <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Already reviewed */}
        {user && userProfile?.role === 'viewer' && userReview && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {t('alreadyReviewed')}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-700">
            <a href="/login" className="underline font-semibold">{t('loginLink')}</a> {t('loginToReview')}
          </div>
        )}

        {/* Reviews */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t('reviews')}</h2>
          {creator.review_count > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{t('reviewsTotal', { count: creator.review_count })}</span>
          )}
        </div>

        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <ReviewCard key={review.id} review={review} currentUserId={user?.id} creatorUserId={creator.user_id} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-semibold text-gray-700">{t('noReviews')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noReviewsSub')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
