'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { validatePlatformUrls } from '@/lib/platformVerification'

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
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export default function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [creator, setCreator] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)

  // Step 1 fields
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')

  // Flow state
  const [step, setStep] = useState<1 | 2>(1)
  const [verificationCode, setVerificationCode] = useState('')
  const [detectedPlatforms, setDetectedPlatforms] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('creators').select('*').eq('slug', slug).single().then(({ data }) => {
      // Redirect if profile doesn't exist, is already claimed, or already has an owner
      if (!data || data.is_claimed || (data.user_id && data.user_id !== user?.id)) {
        router.push(`/creators/${slug}`)
        return
      }
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

  const detectPlatforms = (urls: { youtube: string; instagram: string; tiktok: string }) => {
    const platforms: string[] = []
    if (urls.youtube.trim()) platforms.push('YouTube')
    if (urls.instagram.trim()) platforms.push('Instagram')
    if (urls.tiktok.trim()) platforms.push('TikTok')
    return platforms
  }

  const handleStartVerification = async () => {
    setLoading(true)
    setError('')

    const platformError = validatePlatformUrls(
      { youtube: youtubeUrl, instagram: instagramUrl, tiktok: tiktokUrl },
      slug
    )
    if (platformError) { setError(platformError); setLoading(false); return }

    const res = await fetch('/api/creators/claim/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        youtube_url: youtubeUrl,
        instagram_url: instagramUrl,
        tiktok_url: tiktokUrl,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }

    setVerificationCode(data.verificationCode)
    setDetectedPlatforms(detectPlatforms({ youtube: youtubeUrl, instagram: instagramUrl, tiktok: tiktokUrl }))
    setStep(2)
    setLoading(false)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => {
    router.push(`/creators/${slug}/claim/pending`)
  }

  if (!creator) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="text-gray-400">Indlæser...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="max-w-lg mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            <span className="text-white font-bold text-3xl">{creator.display_name[0].toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Er du {creator.display_name}?</h1>
          <p className="text-gray-500 mt-2 text-sm">Verificer dit ejerskab af profilen</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-indigo-600' : 'text-green-600'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-green-100 text-green-600'}`}>
              {step === 1 ? '1' : <CheckIcon />}
            </div>
            Platform-links
          </div>
          <div className="w-8 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              2
            </div>
            Verificer bio
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
          <div className="p-8">
            {/* Not logged in */}
            {!user ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-sm">Du skal have en creator-konto for at overtage denne profil</p>
                <Link
                  href={`/signup?role=creator&claim=${slug}`}
                  className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 text-center shadow-lg shadow-indigo-200 transition-all"
                >
                  Opret creator-konto og overtag
                </Link>
                <Link href={`/login?claim=${slug}`} className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  Jeg har allerede en konto
                </Link>
              </div>
            ) : role !== 'creator' ? (
              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">Du skal have en creator-konto for at overtage profiler</p>
                <Link href={`/signup?role=creator&claim=${slug}`} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                  Opret creator-konto
                </Link>
              </div>

            ) : step === 1 ? (
              /* ── STEP 1: Platform URLs ── */
              <div className="space-y-5">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                  <strong className="block mb-1">Sådan virker det</strong>
                  Du angiver dine platform-links. Vi genererer en unik kode, som du midlertidigt tilføjer til din bio. Admin bekræfter at koden er der og godkender overtagelsen.
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Dine platform-links <span className="text-red-400">*</span>
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Brugernavnet i linket skal stemme overens med profil-URL'en <strong>"{slug}"</strong>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-red-400 focus-within:border-transparent transition">
                      <span className="text-red-500 flex-shrink-0"><YoutubeIcon /></span>
                      <input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="youtube.com/@ditnavn"
                        type="url"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-pink-400 focus-within:border-transparent transition">
                      <span className="text-pink-500 flex-shrink-0"><InstagramIcon /></span>
                      <input
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="instagram.com/ditnavn"
                        type="url"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-gray-800 focus-within:border-transparent transition">
                      <span className="text-gray-800 flex-shrink-0"><TiktokIcon /></span>
                      <input
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        placeholder="tiktok.com/@ditnavn"
                        type="url"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartVerification}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Behandler...
                    </>
                  ) : 'Start verificering →'}
                </button>
                <Link href={`/creators/${slug}`} className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Annuller
                </Link>
              </div>

            ) : (
              /* ── STEP 2: Add code to bio ── */
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-900">Anmodning registreret</h2>
                  <p className="text-sm text-gray-500 mt-1">Tilføj nu denne kode til din bio</p>
                </div>

                {/* The code */}
                <div className="bg-gray-900 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Din verifikationskode</span>
                    <button
                      onClick={handleCopyCode}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                    >
                      {copied ? <><CheckIcon /> Kopieret!</> : <><CopyIcon /> Kopiér</>}
                    </button>
                  </div>
                  <code className="text-indigo-400 font-mono text-lg font-bold tracking-wide">{verificationCode}</code>
                </div>

                {/* Instructions per platform */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tilføj koden til:</p>

                  {detectedPlatforms.includes('YouTube') && (
                    <div className="flex gap-3 bg-red-50 border border-red-100 rounded-xl p-3.5">
                      <span className="text-red-500 mt-0.5 flex-shrink-0"><YoutubeIcon /></span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-0.5">YouTube</div>
                        <div className="text-xs text-gray-600">Gå til <strong>YouTube Studio → Tilpas kanal → Beskrivelse</strong> og indsæt koden et sted i beskrivelsen.</div>
                      </div>
                    </div>
                  )}

                  {detectedPlatforms.includes('Instagram') && (
                    <div className="flex gap-3 bg-pink-50 border border-pink-100 rounded-xl p-3.5">
                      <span className="text-pink-500 mt-0.5 flex-shrink-0"><InstagramIcon /></span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-0.5">Instagram</div>
                        <div className="text-xs text-gray-600">Gå til <strong>Rediger profil → Bio</strong> og indsæt koden i din bio-tekst.</div>
                      </div>
                    </div>
                  )}

                  {detectedPlatforms.includes('TikTok') && (
                    <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                      <span className="text-gray-800 mt-0.5 flex-shrink-0"><TiktokIcon /></span>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-0.5">TikTok</div>
                        <div className="text-xs text-gray-600">Gå til <strong>Rediger profil → Bio</strong> og indsæt koden i din bio-tekst.</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
                  <strong>Vigtigt:</strong> Lad koden stå i din bio indtil vi har verificeret din anmodning. Du modtager en email når den er godkendt — typisk inden for 24-48 timer. Du kan fjerne koden bagefter.
                </div>

                <button
                  onClick={handleDone}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Jeg har tilføjet koden ✓
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
