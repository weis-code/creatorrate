'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import StarRating from '@/components/StarRating'

const PLATFORMS = [
  { value: 'YouTube',   emoji: '▶️' },
  { value: 'TikTok',    emoji: '🎵' },
  { value: 'Instagram', emoji: '📸' },
  { value: 'Twitch',    emoji: '🟣' },
  { value: 'Podcast',   emoji: '🎙️' },
  { value: 'Andet',     emoji: '🌐' },
]

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const [profile, setProfile] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [links, setLinks] = useState({ youtube_url: '', instagram_url: '', tiktok_url: '', website_url: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Reviews
  const [reviews, setReviews] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ rating: 0, content: '', platform: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data ?? { id: user.id, role: 'viewer', username: '' })
      setUsername(data?.username ?? '')
      if (data?.role === 'creator') {
        const { data: c } = await supabase.from('creators').select('*').eq('user_id', user.id).single()
        if (c) {
          setCreator(c)
          setLinks({
            youtube_url: c.youtube_url ?? '',
            instagram_url: c.instagram_url ?? '',
            tiktok_url: c.tiktok_url ?? '',
            website_url: c.website_url ?? '',
          })
        }
      }
      // Fetch reviews written by this user
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, creator:creators(display_name, slug)')
        .eq('viewer_id', user.id)
        .order('created_at', { ascending: false })
      setReviews(reviewData ?? [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', profile.id)

    if (profileError) {
      if (profileError.code === '23505') setError(t('usernameTaken'))
      else setError(tCommon('error') + ': ' + profileError.message)
      setLoading(false)
      return
    }

    if (creator) {
      const { error: creatorError } = await supabase
        .from('creators')
        .update(links)
        .eq('id', creator.id)

      if (creatorError) {
        setError(tCommon('error') + ': ' + creatorError.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  const startEdit = (review: any) => {
    setEditingId(review.id)
    setEditForm({ rating: review.rating, content: review.content, platform: review.platform ?? '' })
    setEditError('')
  }

  const handleEditSave = async (reviewId: string) => {
    if (editForm.rating === 0) { setEditError('Vælg en rating'); return }
    if (editForm.content.trim().length < 10) { setEditError('Anmeldelsen skal være mindst 10 tegn'); return }
    setEditLoading(true)
    setEditError('')

    const { error } = await supabase
      .from('reviews')
      .update({
        rating: editForm.rating,
        content: editForm.content.trim(),
        platform: editForm.platform || null,
      })
      .eq('id', reviewId)
      .eq('viewer_id', profile.id)

    if (error) {
      setEditError('Kunne ikke gemme: ' + error.message)
    } else {
      setReviews(prev => prev.map(r => r.id === reviewId
        ? { ...r, rating: editForm.rating, content: editForm.content.trim(), platform: editForm.platform || null }
        : r
      ))
      setEditingId(null)
    }
    setEditLoading(false)
  }

  if (!profile) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-gray-400">{tCommon('loading')}</div>
    </div>
  )

  const initials = username ? username.slice(0, 2).toUpperCase() : '?'
  const backHref = profile.role === 'creator' ? '/dashboard' : '/'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-8">
        <div className="max-w-xl mx-auto">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm font-medium mb-4 group transition-colors">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border border-white/30">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-4 pb-16 space-y-4">
        {/* Profile form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {t('saved')}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('username')}</label>
                <div className="flex">
                  <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl px-3 py-2.5 text-sm text-gray-400 flex items-center">@</span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50"
                    required
                    minLength={3}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('email')}</label>
                <div className="relative">
                  <input
                    value={email}
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed pr-32"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-50">{t('emailReadOnly')}</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('role')}</label>
                <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <span className="text-lg">{profile.role === 'creator' ? '🎬' : '👀'}</span>
                  <span className="text-sm text-gray-700 font-medium capitalize">
                    {profile.role === 'creator' ? t('creator') : t('viewer')}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform links — only for creators */}
            {creator && (
              <div className="px-6 pb-5 space-y-3 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform links</p>

                {/* YouTube */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-red-400 focus-within:border-transparent transition">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <input
                    value={links.youtube_url}
                    onChange={(e) => setLinks(l => ({ ...l, youtube_url: e.target.value }))}
                    placeholder="youtube.com/@ditnavn"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-pink-400 focus-within:border-transparent transition">
                  <svg className="w-5 h-5 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <input
                    value={links.instagram_url}
                    onChange={(e) => setLinks(l => ({ ...l, instagram_url: e.target.value }))}
                    placeholder="instagram.com/ditnavn"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-gray-800 focus-within:border-transparent transition">
                  <svg className="w-5 h-5 text-gray-800 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                  </svg>
                  <input
                    value={links.tiktok_url}
                    onChange={(e) => setLinks(l => ({ ...l, tiktok_url: e.target.value }))}
                    placeholder="tiktok.com/@ditnavn"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Website */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <input
                    value={links.website_url}
                    onChange={(e) => setLinks(l => ({ ...l, website_url: e.target.value }))}
                    placeholder="ditwebsite.dk"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {t('saving')}
                  </>
                ) : t('saveBtn')}
              </button>
            </div>
          </form>
        </div>

        {/* Reviews written by this user */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Dine anmeldelser {reviews.length > 0 && <span className="text-indigo-500">({reviews.length})</span>}
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm">Du har ikke skrevet nogen anmeldelser endnu.</p>
              <Link href="/creators" className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Find en creator →
              </Link>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${review.is_disputed ? 'border-orange-200' : 'border-gray-100'}`}>
                {/* Review header */}
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
                          {PLATFORMS.find(p => p.value === review.platform)?.emoji} {review.platform}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.is_disputed && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Under behandling</span>
                    )}
                    {!review.is_disputed && editingId !== review.id && (
                      <button
                        onClick={() => startEdit(review)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Rediger
                      </button>
                    )}
                  </div>
                </div>

                {editingId === review.id ? (
                  /* Edit form */
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                    {editError && (
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{editError}</p>
                    )}
                    {/* Rating */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating</label>
                      <StarRating rating={editForm.rating} interactive onRate={(r) => setEditForm(f => ({ ...f, rating: r }))} size="md" />
                    </div>
                    {/* Platform */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Platform</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PLATFORMS.map(({ value, emoji }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEditForm(f => ({ ...f, platform: f.platform === value ? '' : value }))}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              editForm.platform === value
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            {emoji} {value}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Content */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Anmeldelse</label>
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm(f => ({ ...f, content: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition min-h-24 resize-none bg-gray-50"
                        minLength={10}
                      />
                      <p className="text-xs text-gray-400 mt-1">{editForm.content.length} tegn</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(review.id)}
                        disabled={editLoading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5"
                      >
                        {editLoading ? (
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Gem ændringer
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditError('') }}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Review content */
                  <p className="px-5 pb-4 text-sm text-gray-700 leading-relaxed">{review.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
