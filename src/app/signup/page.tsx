'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

function SignupForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') === 'creator' ? 'creator' : 'viewer'

  const [role, setRole] = useState<'viewer' | 'creator'>(defaultRole)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleViewerSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signupError, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, role: 'viewer' } },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    // Supabase returnerer identities: [] hvis email allerede er registreret
    if (data.user?.identities?.length === 0) {
      setError('Der eksisterer allerede en konto med denne email')
      setLoading(false)
      return
    }

    fetch('/api/emails/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, role: 'viewer' }),
    }).catch(() => {})

    window.location.href = '/'
  }

  const handleCreatorCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/creator-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, tier: 'PRO' }),
      })

      let data: any = {}
      try { data = await res.json() } catch { /* ignore parse error */ }

      if (!res.ok) {
        setError(data.error || 'Noget gik galt — prøv igen')
        setLoading(false)
        return
      }

      if (!data.url) {
        setError('Kunne ikke oprette betalingssession — prøv igen')
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch (err: any) {
      setError('Netværksfejl — tjek din forbindelse og prøv igen')
      setLoading(false)
    }
  }

  const logoSection = (
    <div className="text-center mb-8">
      <Link href="/" className="inline-flex items-center gap-2.5 mb-6 justify-center">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
          <span className="text-white font-black">CR</span>
        </div>
        <span className="font-black text-xl text-white tracking-tight">CreatorRate</span>
      </Link>
      <h1 className="text-2xl font-black text-white tracking-tight">{t('createAccount')}</h1>
      <p className="text-white/40 mt-1 text-sm">{t('createSubtext')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center py-12 px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-700/15 rounded-full blur-[120px]" />
      </div>
      <div className="w-full max-w-md relative">
        {logoSection}

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 border border-white/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />

          <div className="p-8">
            {/* Role selector */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
              {(['viewer', 'creator'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    role === r
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r === 'viewer' ? t('asViewer') : t('asCreator')}
                </button>
              ))}
            </div>

            {role === 'creator' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 text-xs text-indigo-700">
                {t('creatorInfo')}
              </div>
            )}

            <form onSubmit={role === 'creator' ? handleCreatorCheckout : handleViewerSignup} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('usernamePlaceholder')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordHint')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {tCommon('loading')}
                  </>
                ) : role === 'creator' ? 'Gå til betaling — $5/md' : t('createBtn')}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              {t('alreadyAccount')}{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                {t('loginLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const t = useTranslations('common')
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f] flex items-center justify-center"><div className="text-white/30">{t('loading')}</div></div>}>
      <SignupForm />
    </Suspense>
  )
}
