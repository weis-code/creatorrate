import Link from 'next/link'

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-10">
          <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600 -mx-10 -mt-10 mb-8" />
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Betaling gennemført!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Vi opretter din konto nu og sender dig en bekræftelsesmail inden for få sekunder.
          </p>

          <div className="space-y-3 text-left mb-6">
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

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 mb-6">
            Tjek også din spam-mappe hvis du ikke ser mailen inden for 1 minut.
          </div>

          <p className="text-xs text-gray-400">
            Kom herhen ved en fejl?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Gå til login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
