'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type Status = 'checking' | 'ready' | 'slow' | 'timeout'

function SuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    if (!email) { setStatus('ready'); return }

    let attempts = 0
    const maxAttempts = 20 // 20 × 3s = 60s total
    const slowThreshold = 5  // after 5 × 3s = 15s, show "taking longer" message

    const check = async () => {
      try {
        const res = await fetch(`/api/auth/signup-status?email=${encodeURIComponent(email)}`)
        const { ready } = await res.json()
        if (ready) {
          setStatus('ready')
          return
        }
      } catch {
        // Network error — keep trying
      }

      attempts++
      if (attempts >= maxAttempts) {
        setStatus('timeout')
        return
      }
      if (attempts >= slowThreshold) {
        setStatus('slow')
      }

      setTimeout(check, 3000)
    }

    // Start polling after a short initial delay
    setTimeout(check, 2000)
  }, [email])

  if (status === 'checking' || status === 'slow') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
            <div className="px-10 py-12">
              <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg className="animate-spin w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Betaling bekræftet!</h2>
              {status === 'slow' ? (
                <>
                  <p className="text-gray-500 text-sm mb-1">Din konto oprettes — det tager lidt længere end normalt.</p>
                  <p className="text-gray-400 text-xs">Vent venligst et øjeblik...</p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Din konto oprettes nu. Et øjeblik...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-500" />
            <div className="px-10 py-10">
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Det tager lidt tid</h2>
              <p className="text-gray-500 text-sm mb-6">
                Din betaling er gået igennem, men det ser ud til at oprettelsen af din konto tager lidt ekstra tid.
                Du vil modtage en velkomstmail, når kontoen er klar.
              </p>
              {email && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-6 text-left">
                  <p className="text-xs text-orange-700 font-medium">Vi sender en mail til:</p>
                  <p className="text-sm text-orange-900 font-semibold mt-0.5">{email}</p>
                </div>
              )}
              <p className="text-gray-400 text-xs">
                Brug din email og det kodeord du valgte ved oprettelsen, når du logger ind.
                Kontakt os på{' '}
                <a href="mailto:support@creatorrate.io" className="text-indigo-600 hover:underline">
                  support@creatorrate.io
                </a>{' '}
                hvis du ikke har modtaget en mail inden for 10 minutter.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // status === 'ready'
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />

          <div className="px-10 pt-10 pb-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Betaling gennemført!</h2>
            <p className="text-gray-500 text-sm">
              Din konto er klar. Du kan logge ind med det samme.
            </p>
          </div>

          {/* Login info */}
          {email && (
            <div className="mx-6 mb-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 text-left">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🔑</span>
                <div>
                  <p className="font-bold text-indigo-900 text-sm mb-1">Log ind med dine oplysninger</p>
                  <p className="text-indigo-700 text-sm mb-1">
                    <span className="font-semibold">Email:</span> {email}
                  </p>
                  <p className="text-indigo-600 text-xs">Brug det kodeord du valgte ved oprettelsen.</p>
                </div>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="px-6 space-y-3 mb-6">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">1️⃣</span>
              <span className="text-sm text-gray-700">Log ind med din email og dit kodeord</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">2️⃣</span>
              <span className="text-sm text-gray-700">Opsæt din creator profil</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">3️⃣</span>
              <span className="text-sm text-gray-700">Modtag og svar på anmeldelser</span>
            </div>
          </div>

          <div className="px-6 mb-8">
            <Link
              href="/login"
              className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Log ind nu →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
