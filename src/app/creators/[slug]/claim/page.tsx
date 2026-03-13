'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { validatePlatformUrls } from '@/lib/platformVerification'
import { useTranslations } from 'next-intl'

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

export default function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const t = useTranslations('claim')
  const tCommon = useTranslations('common')
  const [creator, setCreator] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('creators').select('*').eq('slug', slug).single().then(({ data }) => {
      if (!data || data.is_claimed) { router.push(`/creators/${slug}`); return }
      setCreator(data)
    })

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setRole(data?.role ?? null)
      }
    })
  }, [slug])

  const handleClaim = async () => {
    setLoading(true)
    setError('')

    const platformError = validatePlatformUrls(
      { youtube: youtubeUrl, instagram: instagramUrl, tiktok: tiktokUrl },
      slug
    )
    if (platformError) { setError(platformError); setLoading(false); return }

    const res = await fetch('/api/creators/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, youtube_url: youtubeUrl, instagram_url: instagramUrl, tiktok_url: tiktokUrl }),
    })
    const { error: err } = await res.json()
    if (err) { setError(err); setLoading(false); return }
    router.push('/dashboard')
  }

  if (!creator) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="text-gray-400">{tCommon('loading')}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            <span className="text-white font-bold text-3xl">{creator.display_name[0].toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('areYou', { name: creator.display_name })}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t('subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
          <div className="p-8">
            {!user ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-sm">{t('needCreatorAccount')}</p>
                <Link
                  href={`/signup?role=creator&claim=${slug}`}
                  className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 text-center shadow-lg shadow-indigo-200 transition-all"
                >
                  {t('createAndClaim')}
                </Link>
                <Link href={`/login?claim=${slug}`} className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  {t('alreadyHaveAccount')}
                </Link>
              </div>
            ) : role !== 'creator' ? (
              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">{t('notCreatorMsg')}</p>
                <Link href={`/signup?role=creator&claim=${slug}`} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                  {t('createCreatorAccount')}
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {error}
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong>{t('warning')}</strong> {t('warningText', { name: creator.display_name })}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t('confirmOwnership')} <span className="text-red-400">*</span>
                  </p>
                  <p className="text-xs text-gray-400 mb-3">{t('confirmSubtext', { slug })}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-red-400 focus-within:border-transparent transition">
                      <span className="text-red-500 flex-shrink-0"><YoutubeIcon /></span>
                      <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="youtube.com/@ditnavn" type="url" className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"/>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-pink-400 focus-within:border-transparent transition">
                      <span className="text-pink-500 flex-shrink-0"><InstagramIcon /></span>
                      <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="instagram.com/ditnavn" type="url" className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"/>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-gray-800 focus-within:border-transparent transition">
                      <span className="text-gray-800 flex-shrink-0"><TiktokIcon /></span>
                      <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="tiktok.com/@ditnavn" type="url" className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"/>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t('claiming')}
                    </>
                  ) : t('claimBtn')}
                </button>
                <Link href={`/creators/${slug}`} className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  {t('cancel')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
