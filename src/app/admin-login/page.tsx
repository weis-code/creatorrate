import { adminLogin } from './actions'

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const hasError = params?.error === '1'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">⚙️</div>
          <h1 className="text-xl font-bold text-gray-900">Admin adgang</h1>
          <p className="text-sm text-gray-500 mt-1">Indtast din admin email</p>
        </div>

        <form action={adminLogin} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {hasError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              Forkert email – prøv igen.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Log ind
          </button>
        </form>
      </div>
    </div>
  )
}
