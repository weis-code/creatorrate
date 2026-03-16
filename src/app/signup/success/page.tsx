'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleResend = async () => {
    if (!email || resendState === 'sending' || resendState === 'sent') return
    setResendState('sending')
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error === 'already_confirmed') {
        setResendState('sent') // treat as success
      } else if (!res.ok) {
        setResendState('error')
      } else {
        setResendState('sent')
      }
    } catch {
      setResendState('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />

          {/* Header */}
          <div className="px-10 pt-10 pb-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Betaling gennemført!</h2>
            <p className="text-gray-500 text-sm">
              Vi opretter din konto nu og sender dig en bekræftelsesmail om få sekunder.
            </p>
          </div>

          {/* Email confirmation alert — prominent */}
          <div className="mx-6 mb-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 text-left">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">📧</span>
              <div>
                <p className="font-bold text-indigo-900 text-sm mb-1">Du skal bekræfte din email for at logge ind</p>
                {email && (
                  <p className="text-indigo-700 text-sm mb-2">
                    Vi sender bekræftelseslinket til <span className="font-semibold">{email}</span>
                  </p>
                )}
                <p className="text-indigo-600 text-xs">Tjek også spam-mappen hvis du ikke ser mailen inden for 1 minut.</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="px-6 space-y-3 mb-6">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">1️⃣</span>
              <span className="text-sm text-gray-700">Tjek din indbakke for en bekræftelsesmail</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">2️⃣</span>
              <span className="text-sm text-gray-700">Klik på linket i mailen for at bekræfte din konto</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl">3️⃣</span>
              <span className="text-sm text-gray-700">Du sendes automatisk til opsætning af din creator profil</span>
            </div>
          </div>

          {/* Resend button */}
          {email && (
            <div className="px-6 mb-6">
              {resendState === 'sent' ? (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                  ✓ Ny bekræftelsesmail sendt!
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendState === 'sending'}
                  className="w-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {resendState === 'sending' ? 'Sender...' : 'Gensend bekræftelsesmail'}
                </button>
              )}
              {resendState === 'error' && (
                <p className="text-red-500 text-xs mt-2 text-center">Noget gik galt. Prøv igen om lidt.</p>
              )}
            </div>
          )}

          <div className="px-6 pb-8">
            <p className="text-xs text-gray-400">
              Kom herhen ved en fejl?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Gå til login
              </Link>
            </p>
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
