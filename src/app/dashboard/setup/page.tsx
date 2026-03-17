'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validatePlatformUrls } from '@/lib/platformVerification'
import { useTranslations } from 'next-intl'

const CATEGORIES = ['Gaming', 'Lifestyle', 'Tech', 'Beauty', 'Fitness', 'Mad', 'Musik', 'Podcast', 'Andet']

const YoutubeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TiktokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

function SetupPage() {
  const t = useTranslations('setup')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get('payment') === 'success'
  const [existingCreatorId, setExistingCreatorId] = useState<string | null>(null)
  const [form, setForm] = useState({
    display_name: '',
    slug: '',
    bio: '',
    category: '',
    youtube_url: '',
    instagram_url: '',
    tiktok_url: '',
    website_url: '',
    avatar_url: '',
  })
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load existing creator data if present
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('creators').select('*').eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          setExistingCreatorId(data.id)
          setForm({
            display_name: data.display_name || '',
            slug: data.slug || '',
            bio: data.bio || '',
            category: data.category || '',
            youtube_url: data.youtube_url || '',
            instagram_url: data.instagram_url || '',
            tiktok_url: data.tiktok_url || '',
            website_url: data.website_url || '',
            avatar_url: data.avatar_url || '',
          })
        }
      })
    })
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Billedet må max være 5 MB'); return }

    setAvatarUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAvatarUploading(false); return }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError('Upload fejlede: ' + uploadError.message)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setForm(f => ({ ...f, avatar_url: publicUrl }))
    }
    setAvatarUploading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === 'display_name' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const platformError = validatePlatformUrls(
      { youtube: form.youtube_url, instagram: form.instagram_url, tiktok: form.tiktok_url },
      form.slug
    )
    if (platformError) { setError(platformError); setLoading(false); return }

    // If user already has a creator row, update it
    if (existingCreatorId) {
      const { error } = await supabase.from('creators').update({
        display_name: form.display_name,
        slug: form.slug,
        bio: form.bio,
        category: form.category,
        youtube_url: form.youtube_url,
        instagram_url: form.instagram_url,
        tiktok_url: form.tiktok_url,
        website_url: form.website_url,
        avatar_url: form.avatar_url || null,
      }).eq('id', existingCreatorId)

      if (error) {
        if (error.code === '23505') setError(t('slugTaken'))
        else setError(tCommon('error') + ': ' + error.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
      return
    }

    // Check if slug exists as unclaimed placeholder — claim it instead
    const { data: existing } = await supabase
      .from('creators')
      .select('id, is_claimed')
      .eq('slug', form.slug)
      .single()

    if (existing && !existing.is_claimed) {
      // Redirect to the proper claim flow for this slug
      router.push(`/creators/${form.slug}/claim`)
      return
    }

    const { error } = await supabase.from('creators').insert({
      user_id: user.id,
      ...form,
    })

    if (error) {
      if (error.code === '23505') setError(t('slugTaken'))
      else setError(tCommon('error') + ': ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const initials = form.display_name
    ? form.display_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {paymentSuccess && (
        <div className="bg-green-500 text-white text-center py-3 px-4 text-sm font-medium">
          🎉 Betaling gennemført! Udfyld nu din creator-profil herunder.
        </div>
      )}
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-10 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
            {t('newCreator')}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-indigo-200 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>

            {/* Avatar preview + navn */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4 mb-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden shadow-lg group focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Klik for at uploade profilbillede"
                >
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{initials}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    {avatarUploading ? (
                      <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    )}
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{t('preview')}</p>
                  <p className="text-lg font-semibold text-gray-900">{form.display_name || 'Dit navn'}</p>
                  <p className="text-xs text-indigo-500">creatorrate.dk/creators/{form.slug || '...'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t('creatorName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="display_name"
                    value={form.display_name}
                    onChange={handleChange}
                    placeholder="fx MrBeast"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t('profileUrl')} <span className="text-red-400">*</span>
                  </label>
                  <div className="flex">
                    <span className="bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl px-2.5 py-2.5 text-xs text-gray-400 whitespace-nowrap flex items-center">
                      /creators/
                    </span>
                    <input
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 min-w-0"
                      required
                      pattern="[a-z0-9-]+"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kategori + Bio */}
            <div className="p-6 border-b border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('category')}</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50"
                >
                  <option value="">{t('chooseCategory')}</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('bio')}</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('bioPlaceholder')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 resize-none"
                />
              </div>
            </div>

            {/* Platform-links */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('platformLinks')} <span className="text-red-400">{t('platformLinksRequired')}</span>
                </h3>
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">{t('platformLinksHint')}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">{t('platformLinksHint')}</p>

              <div className="space-y-3">
                {/* YouTube */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-red-400 focus-within:border-transparent transition">
                  <span className="text-red-500 flex-shrink-0"><YoutubeIcon /></span>
                  <input
                    name="youtube_url"
                    value={form.youtube_url}
                    onChange={handleChange}
                    placeholder="youtube.com/@ditnavn"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-pink-400 focus-within:border-transparent transition">
                  <span className="text-pink-500 flex-shrink-0"><InstagramIcon /></span>
                  <input
                    name="instagram_url"
                    value={form.instagram_url}
                    onChange={handleChange}
                    placeholder="instagram.com/ditnavn"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-gray-800 focus-within:border-transparent transition">
                  <span className="text-gray-800 flex-shrink-0"><TiktokIcon /></span>
                  <input
                    name="tiktok_url"
                    value={form.tiktok_url}
                    onChange={handleChange}
                    placeholder="tiktok.com/@ditnavn"
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Website */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition">
                  <span className="text-gray-400 flex-shrink-0"><GlobeIcon /></span>
                  <input
                    name="website_url"
                    value={form.website_url}
                    onChange={handleChange}
                    placeholder={t('website')}
                    type="url"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="p-6 space-y-3">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}
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
                    {t('creating')}
                  </>
                ) : (
                  t('createBtn')
                )}
              </button>
              <p className="text-center text-xs text-gray-400">
                {t('ownershipDisclaimer')}
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function SetupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Indlæser...</div></div>}>
      <SetupPage />
    </Suspense>
  )
}
