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
            Vi opretter din konto nu. Du modtager en bekræftelsesmail inden for få sekunder.<br /><br />
            Klik på linket i mailen for at bekræfte din konto og komme i gang med at opsætte din creator profil.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700 mb-6">
            Tjek også din spam-mappe hvis du ikke ser mailen inden for 1 minut.
          </div>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">
            Gå til login →
          </Link>
        </div>
      </div>
    </div>
  )
}
