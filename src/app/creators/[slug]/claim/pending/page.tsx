import Link from 'next/link'

export default async function ClaimPendingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-center">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
          <div className="p-10">
            {/* Icon */}
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Afventer godkendelse</h1>
            <p className="text-gray-500 text-sm mb-6">
              Vi har modtaget din verifikationsanmodning. Vores team vil tjekke at verifikationskoden er tilføjet til din bio og godkende din overtagelse.
            </p>

            {/* Steps */}
            <div className="text-left space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Anmodning indsendt</div>
                  <div className="text-xs text-gray-400">Vi har registreret din overtagelsesanmodning</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Admin verificerer</div>
                  <div className="text-xs text-gray-400">Vi tjekker at koden er tilføjet til din bio (24-48 timer)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-400">Profil aktiveres</div>
                  <div className="text-xs text-gray-300">Du modtager en email og får adgang til din profil</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 mb-6 text-left">
              <strong>Husk:</strong> Lad verifikationskoden stå i din bio indtil du har modtaget godkendelsesmailen. Du kan fjerne den bagefter.
            </div>

            <Link
              href="/"
              className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all text-sm"
            >
              Gå til forsiden
            </Link>
            <Link
              href={`/creators/${slug}`}
              className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Se profilen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
