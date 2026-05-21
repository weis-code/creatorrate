import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StarRating from '@/components/StarRating'
import ReviewCard from '@/components/ReviewCard'
import WriteReviewButton from '@/components/WriteReviewButton'
import CreatorAvatar from '@/components/CreatorAvatar'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.io'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: creator } = await supabase
    .from('creators')
    .select('display_name, bio, avatar_url, slug, average_rating, review_count')
    .eq('slug', slug)
    .single()
  if (!creator) return {}
  const profileUrl = `${APP_URL}/creators/${slug}`
  const title = `${creator.display_name} Reviews & Ratings`
  const reviewCount = creator.review_count ?? 0
  const rating = creator.average_rating?.toFixed(1) ?? null
  const descriptionSuffix = reviewCount > 0 && rating
    ? ` ${reviewCount} anmeldelser · ${rating}/5 stjerner på CreatorRate.`
    : ` Se anmeldelser på CreatorRate.`
  const bioSnippet = creator.bio ? creator.bio.slice(0, 110) + '.' : ''
  const description = (bioSnippet + descriptionSuffix).slice(0, 160)
  return {
    title,
    description,
    openGraph: {
      title: `${creator.display_name} Reviews & Ratings | CreatorRate`,
      description,
      url: profileUrl,
      siteName: 'CreatorRate',
      type: 'profile',
      images: creator.avatar_url
        ? [{ url: creator.avatar_url, width: 400, height: 400, alt: creator.display_name }]
        : [{ url: `${APP_URL}/logo.svg`, width: 512, height: 512, alt: 'CreatorRate' }],
    },
    twitter: {
      card: 'summary',
      title: `${creator.display_name} Reviews & Ratings | CreatorRate`,
      description,
      images: creator.avatar_url ? [creator.avatar_url] : [`${APP_URL}/logo.svg`],
    },
    alternates: {
      canonical: profileUrl,
    },
  }
}

const YoutubeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)
const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)
const TiktokIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
)
const GlobeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    { url: creator.youtube_url, label: t('youtube'), icon: <YoutubeIcon />, color: 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20' },
    { url: creator.instagram_url, label: t('instagram'), icon: <InstagramIcon />, color: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20' },
    { url: creator.tiktok_url, label: t('tiktok'), icon: <TiktokIcon />, color: 'text-white/70 bg-white/8 hover:bg-white/15 border-white/10' },
    { url: creator.website_url, label: t('website'), icon: <GlobeIcon />, color: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20' },
  ].filter((l) => l.url)

  const profileUrl = `${APP_URL}/creators/${slug}`
  const avgRating = creator.average_rating ?? 0
  const reviewCount = reviews?.length ?? 0

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${APP_URL}/#organization`,
        name: 'CreatorRate',
        url: APP_URL,
        logo: `${APP_URL}/logo.svg`,
        description: 'Trustpilot for creators — anmeld dine favorit YouTubere, TikTokere og andre creators.',
      },
      {
        '@type': 'ProfilePage',
        '@id': profileUrl,
        url: profileUrl,
        name: `${creator.display_name} anmeldelser — CreatorRate`,
        isPartOf: { '@id': `${APP_URL}/#organization` },
        ...(reviewCount > 0 && avgRating > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating.toFixed(1),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        } : {}),
        mainEntity: {
          '@type': 'Person',
          name: creator.display_name,
          description: creator.bio ?? undefined,
          image: creator.avatar_url ?? undefined,
          url: profileUrl,
          ...(creator.youtube_url ? { sameAs: [creator.youtube_url] } : {}),
        },
        ...(reviewCount > 0 ? {
          review: (reviews ?? []).slice(0, 5).map((r) => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              '@type': 'Person',
              name: r.viewer?.username ?? 'Anonym',
            },
            reviewBody: r.content,
            datePublished: r.created_at?.split('T')[0],
          })),
        } : {}),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Dark header section */}
      <div className="bg-[#08080f]">
        <div className="relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-700/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 pt-10 pb-10">

            {/* Claim banner */}
            {!creator.is_claimed && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300 text-sm">{t('claimTitle', { name: creator.display_name })}</p>
                    <p className="text-amber-400/60 text-xs mt-0.5">{t('claimSubtitle')}</p>
                  </div>
                </div>
                <a
                  href={`/creators/${slug}/claim`}
                  className="flex-shrink-0 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors"
                >
                  {t('claimBtn')}
                </a>
              </div>
            )}

            {/* Creator info */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-5">
                <div className="ring-2 ring-white/10 rounded-2xl shadow-xl shadow-black/30 flex-shrink-0">
                  <CreatorAvatar displayName={creator.display_name} avatarUrl={creator.avatar_url} size="xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">{creator.display_name}</h1>
                  {creator.category && (
                    <span className="inline-block text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full mt-1.5">
                      {creator.category}
                    </span>
                  )}
                  {creator.bio && (
                    <p className="text-white/40 mt-3 text-sm leading-relaxed max-w-lg">{creator.bio}</p>
                  )}
                  {/* Social links */}
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {socialLinks.map(({ url, label, icon, color }) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 ${color} border text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors`}
                        >
                          {icon}
                          {label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!userReview && creator.user_id !== user?.id && (
                <div className="flex-shrink-0">
                  <WriteReviewButton creatorId={creator.id} creatorSlug={slug} />
                </div>
              )}
            </div>

            {/* Rating overview */}
            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 flex gap-8 items-center">
              <div className="text-center flex-shrink-0">
                <div className="text-5xl font-black text-white">
                  {creator.average_rating > 0 ? creator.average_rating.toFixed(1) : '–'}
                </div>
                <StarRating rating={creator.average_rating} size="md" />
                <div className="text-xs text-white/30 mt-1.5">{creator.review_count} {t('reviews')}</div>
              </div>
              <div className="flex-1 space-y-2">
                {ratingCounts.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-2.5">
                    <span className="text-xs text-white/40 w-3 text-right">{star}</span>
                    <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 bg-white/8 rounded-full h-1.5">
                      <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-xs text-white/30 w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Gradient fade */}
        <div className="h-14 bg-gradient-to-b from-[#08080f] to-white" />
      </div>

      {/* Reviews section — light */}
      <div className="max-w-4xl mx-auto px-4 pb-16">

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

        {/* Reviews header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">{t('reviews')}</h2>
          {creator.review_count > 0 && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">{t('reviewsTotal', { count: creator.review_count })}</span>
          )}
        </div>

        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <ReviewCard key={review.id} review={review} currentUserId={user?.id} creatorUserId={creator.user_id} creatorName={creator.display_name} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-black text-gray-800 tracking-tight">{t('noReviews')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('noReviewsSub')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
