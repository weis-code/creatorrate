'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

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
