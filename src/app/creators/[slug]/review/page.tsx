'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StarRating from '@/components/StarRating'
import { useTranslations } from 'next-intl'

const ratingColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-lime-500', 'text-green-500']

export default function WriteReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const ratingLabels = ['', t('veryBad'), t('bad'), t('okay'), t('good'), t('excellent')]
  const [creator, setCreator] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('creators').select('*').eq('slug', slug).single().then(({ data }) => {
      if (!data) router.push('/creators')
      setCreator(data)
    })
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError(t('clickStars')); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?redirect=/creators/${slug}/review`); return }

    const { data: profile } = await supabase.from('profiles').select('role, username').eq('id', user.id).single()
    if (profile?.role === 'creator') { setError(t('creatorsCantReview')); setLoading(false); return }

    const { error } = await supabase.from('reviews').insert({
      creator_id: creator.id,
      viewer_id: user.id,
      rating,
      content,
      platform: platform || null,
    })

    if (error) {
      if (error.code === '23505') setError(t('alreadyReviewed'))
      else setError(t('reviewError') + error.message)
      setLoading(false)
      return
    }

    // Notify creator via email (fire and forget)
    fetch('/api/emails/new-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId: creator.id,
        reviewerUsername: profile?.username ?? 'Someone',
        rating,
        content,
      }),
    }).catch(() => {})

    router.push(`/creators/${slug}`)
  }

  if (!creator) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="text-gray-400">{tCommon('loading')}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="max-w-xl mx-auto px-4 py-12">
        <a href={`/creators/${slug}`} className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-6 group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backTo', { name: creator.display_name })}
        </a>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />

          <div className="p-8">
            {/* Creator mini-header */}
            <div className="flex items-center gap-4 mb-7 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">{creator.display_name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{t('reviewing')}</p>
                <h1 className="text-lg font-bold text-gray-900">{creator.display_name}</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Star rating */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('yourRating')}</label>
                <div className="bg-gray-50 rounded-xl p-5 text-center">
                  <StarRating rating={rating} interactive onRate={setRating} size="lg" />
                  <p className={`text-sm font-semibold mt-2 min-h-5 ${ratingColors[rating]}`}>
                    {rating === 0 ? <span className="text-gray-400 font-normal">{t('clickStars')}</span> : ratingLabels[rating]}
                  </p>
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('platform')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'YouTube',   label: 'YouTube',   emoji: '▶️' },
                    { value: 'TikTok',    label: 'TikTok',    emoji: '🎵' },
                    { value: 'Instagram', label: 'Instagram', emoji: '📸' },
                    { value: 'Twitch',    label: 'Twitch',    emoji: '🟣' },
                    { value: 'Podcast',   label: 'Podcast',   emoji: '🎙️' },
                    { value: 'Andet',     label: t('platformOther'), emoji: '🌐' },
                  ].map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPlatform(platform === value ? '' : value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        platform === value
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{t('platformHint')}</p>
              </div>

              {/* Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('yourReview')}</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('reviewPlaceholder')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition min-h-32 resize-none leading-relaxed"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">{content.length > 0 && `${content.length} tegn`}</p>
              </div>

              <button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {t('sending')}
                  </>
                ) : t('sendBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
