'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

const PLANS = [
  {
    tier: 'BASIC',
    name: 'Basic',
    price: '99 kr/md',
    description: 'Svar på anmeldelser ældre end 1 måned',
    features: ['Svar på ældre anmeldelser', 'Creator profil', 'Disputer anmeldelser'],
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '149 kr/md',
    description: 'Svar på alle anmeldelser med det samme',
    features: ['Svar på alle anmeldelser', 'Creator profil', 'Disputer anmeldelser', 'Prioritet support'],
    popular: true,
  },
]

function SignupForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') === 'creator' ? 'creator' : 'viewer'

  const [role, setRole] = useState<'viewer' | 'creator'>(defaultRole)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PRO'>('PRO')
  const [step, setStep] = useState<'info' | 'plan'>('info')
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

  const handleCreatorNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !username || !password) return
    setStep('plan')
  }

  const handleCreatorCheckout = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/creator-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, tier: selectedTier }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Noget gik galt')
      setLoading(false)
      return
    }

    window.location.href = data.url
  }

  const logoSection = (
    <div className="text-center mb-8">
      <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <span className="text-white font-bold">CR</span>
        </div>
        <span className="font-bold text-xl text-gray-900">CreatorRate</span>
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{t('createAccount')}</h1>
      <p className="text-gray-500 mt-1 text-sm">{t('createSubtext')}</p>
    </div>
  )

  // Step 2: Plan selection for creator
  if (role === 'creator' && step === 'plan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {logoSection}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Vælg dit abonnement</h2>
              <p className="text-sm text-gray-500 mb-4">Du kan altid skifte plan senere.</p>

              {/* Free trial banner */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-4 mb-6 text-center text-white shadow-md shadow-green-100">
                <div className="font-bold text-base">🎉 Første 30 dage er gratis</div>
                <div className="text-sm text-green-100 mt-0.5">Ingen binding — du kan opsige når som helst</div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {PLANS.map((plan) => (
                  <button
                    key={plan.tier}
                    type="button"
                    onClick={() => setSelectedTier(plan.tier as 'BASIC' | 'PRO')}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      selectedTier === plan.tier
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                        Populær
                      </span>
                    )}
                    <div className="font-bold text-gray-900 mb-0.5">{plan.name}</div>
                    <div className="text-lg font-extrabold text-indigo-600 mb-2">{plan.price}</div>
                    <div className="text-xs text-gray-500 mb-3">{plan.description}</div>
                    <ul className="space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreatorCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sender til betaling...
                  </>
                ) : `Gå til betaling — ${selectedTier === 'BASIC' ? '99' : '149'} kr/md`}
              </button>

              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Tilbage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {logoSection}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />

          <div className="p-8">
            {/* Role selector */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
              {(['viewer', 'creator'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setStep('info') }}
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

            <form onSubmit={role === 'creator' ? handleCreatorNextStep : handleViewerSignup} className="space-y-4">
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
                ) : role === 'creator' ? 'Næste → Vælg plan' : t('createBtn')}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">{t('loading')}</div></div>}>
      <SignupForm />
    </Suspense>
  )
}
