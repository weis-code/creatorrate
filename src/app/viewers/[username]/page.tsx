import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StarRating from '@/components/StarRating'

export const dynamic = 'force-dynamic'

const PLATFORMS: Record<string, string> = {
  YouTube: '▶️', TikTok: '🎵', Instagram: '📸',
  Twitch: '🟣', Podcast: '🎙️', Andet: '🌐',
}

export default async function ViewerProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, bio, created_at')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, creator:creators(display_name, slug)')
    .eq('viewer_id', profile.id)
    .order('created_at', { ascending: false })

  const initials = profile.username.slice(0, 2).toUpperCase()
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/creators" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium mb-4 group transition-colors">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tilbage
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl border border-white/30">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">@{profile.username}</h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                Seer siden {new Date(profile.created_at).toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-16 space-y-4">
        {/* Stats + bio */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{reviews?.length ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Anmeldelser</div>
            </div>
            {avgRating !== null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Gns. rating givet</div>
              </div>
            )}
          </div>
          {profile.bio && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{profile.bio}</p>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">
            Anmeldelser {reviews && reviews.length > 0 && <span className="text-indigo-500">({reviews.length})</span>}
          </h2>

          {reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 pt-4 pb-3 flex items-start justify-between">
                    <div>
                      <Link
                        href={`/creators/${review.creator?.slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {review.creator?.display_name ?? 'Ukendt creator'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        {review.platform && (
                          <span className="text-[11px] text-gray-400">
                            {PLATFORMS[review.platform]} {review.platform}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="px-5 pb-4 text-sm text-gray-700 leading-relaxed">{review.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm">Ingen anmeldelser endnu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
