import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalCreators },
    { count: totalReviews },
    { count: disputedReviews },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('creators').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_disputed', true),
    adminSupabase.from('subscriptions').select('tier, status'),
  ])

  const activeCount = subscriptions?.filter(s => s.status === 'active').length ?? 0
  const trialingCount = subscriptions?.filter(s => s.status === 'trialing').length ?? 0
  const pastDueCount = subscriptions?.filter(s => s.status === 'past_due').length ?? 0
  const canceledCount = subscriptions?.filter(s => s.status === 'canceled').length ?? 0
  const activeBasic = subscriptions?.filter(s => s.status === 'active' && s.tier === 'basic').length ?? 0
  const activePro = subscriptions?.filter(s => s.status === 'active' && s.tier === 'pro').length ?? 0

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Creators', value: totalCreators ?? 0, icon: '🎬', color: 'bg-purple-50 text-purple-600' },
    { label: 'Reviews', value: totalReviews ?? 0, icon: '⭐', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Disputed', value: disputedReviews ?? 0, icon: '🚩', color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Abonnementer</h2>
          <Link href="/admin/subscriptions" className="text-sm text-indigo-600 hover:underline">Se alle →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl mb-3">✅</div>
            <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
            <div className="text-sm text-gray-500 mt-0.5">Aktive</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3">🔄</div>
            <div className="text-2xl font-bold text-gray-900">{trialingCount}</div>
            <div className="text-sm text-gray-500 mt-0.5">Trial</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl mb-3">⚠️</div>
            <div className="text-2xl font-bold text-gray-900">{pastDueCount}</div>
            <div className="text-sm text-gray-500 mt-0.5">Forfalden</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center text-xl mb-3">❌</div>
            <div className="text-2xl font-bold text-gray-900">{canceledCount}</div>
            <div className="text-sm text-gray-500 mt-0.5">Annulleret</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Aktive abonnementer fordelt på plan</h3>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-bold text-gray-900">{activeBasic}</div>
              <div className="text-sm text-gray-500">Basic</div>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <div className="text-xl font-bold text-gray-900">{activePro}</div>
              <div className="text-sm text-gray-500">Pro</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">Quick links</h2>
        <div className="space-y-2">
          <a href="/admin/disputes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <span className="text-xl">🚩</span>
            <div>
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Review disputes</div>
              <div className="text-sm text-gray-500">Godkend eller afvis disputerede anmeldelser</div>
            </div>
          </a>
          <a href="/admin/subscriptions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <span className="text-xl">💳</span>
            <div>
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Abonnementer</div>
              <div className="text-sm text-gray-500">Se alle aktive og tidligere abonnementer</div>
            </div>
          </a>
          <a href="/admin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
            <span className="text-xl">👥</span>
            <div>
              <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Brugerstyring</div>
              <div className="text-sm text-gray-500">Se alle registrerede brugere</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
