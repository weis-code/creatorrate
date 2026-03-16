import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ResendConfirmationsButton from './ResendConfirmationsButton'
import FixCreatorButton from './FixCreatorButton'

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
    { data: recentUsers },
    { data: recentReviews },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('creators').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_disputed', true),
    adminSupabase.from('subscriptions').select('tier, status'),
    supabase.from('profiles').select('username, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('reviews').select('content, rating, created_at, creator_id').order('created_at', { ascending: false }).limit(5),
  ])

  const activeCount = subscriptions?.filter(s => s.status === 'active').length ?? 0
  const revenue = activeCount * 99 // rough estimate

  const stats = [
    { label: 'Brugere', value: totalUsers ?? 0, icon: '👥', color: 'from-blue-500 to-blue-600', change: '+2 i dag' },
    { label: 'Creators', value: totalCreators ?? 0, icon: '🎬', color: 'from-purple-500 to-purple-600', change: `${subscriptions?.filter(s => s.status === 'active').length ?? 0} aktive` },
    { label: 'Anmeldelser', value: totalReviews ?? 0, icon: '⭐', color: 'from-yellow-400 to-orange-500', change: `${disputedReviews ?? 0} disputerede` },
    { label: 'MRR (est.)', value: `${revenue.toLocaleString('da')} kr`, icon: '💰', color: 'from-green-500 to-emerald-600', change: `${activeCount} aktive abos` },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Overblik</h1>
        <p className="text-sm text-gray-400 mt-1">Alt hvad der sker på CreatorRate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-3 shadow-sm`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</div>
            <div className="text-[11px] text-gray-400 mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Subscription breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-5">Abonnementer</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Aktive', value: subscriptions?.filter(s => s.status === 'active').length ?? 0, color: 'text-green-600 bg-green-50' },
            { label: 'Trial', value: subscriptions?.filter(s => s.status === 'trialing').length ?? 0, color: 'text-blue-600 bg-blue-50' },
            { label: 'Forfalden', value: subscriptions?.filter(s => s.status === 'past_due').length ?? 0, color: 'text-orange-600 bg-orange-50' },
            { label: 'Annulleret', value: subscriptions?.filter(s => s.status === 'canceled').length ?? 0, color: 'text-gray-500 bg-gray-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl px-4 py-3 ${color.split(' ')[1]}`}>
              <div className={`text-2xl font-black ${color.split(' ')[0]}`}>{value}</div>
              <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50 flex gap-6">
          <div>
            <div className="text-sm font-bold text-gray-900">{subscriptions?.filter(s => s.status === 'active' && s.tier === 'BASIC').length ?? 0}</div>
            <div className="text-xs text-gray-400">Basic</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <div className="text-sm font-bold text-gray-900">{subscriptions?.filter(s => s.status === 'active' && s.tier === 'PRO').length ?? 0}</div>
            <div className="text-xs text-gray-400">Pro</div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-sm">Nye brugere</h2>
            <Link href="/admin/users" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Se alle →</Link>
          </div>
          <div className="space-y-3">
            {recentUsers?.map((user) => (
              <div key={user.created_at} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">@{user.username}</div>
                  <div className="text-[11px] text-gray-400">{new Date(user.created_at).toLocaleDateString('da-DK')}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'creator' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  {user.role}
                </span>
              </div>
            ))}
            {!recentUsers?.length && <p className="text-sm text-gray-400">Ingen brugere endnu</p>}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-sm mb-4">Hurtige handlinger</h2>
          <div className="space-y-2">
            {[
              { href: '/admin/disputes', icon: '🚩', label: 'Review disputes', desc: `${disputedReviews ?? 0} afventer`, urgent: (disputedReviews ?? 0) > 0 },
              { href: '/admin/users', icon: '👥', label: 'Brugerstyring', desc: `${totalUsers ?? 0} brugere i alt`, urgent: false },
              { href: '/admin/subscriptions', icon: '💳', label: 'Abonnementer', desc: `${activeCount} aktive`, urgent: false },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${item.urgent ? 'bg-red-50' : 'bg-gray-50'}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.label}</div>
                  <div className={`text-[11px] ${item.urgent ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{item.desc}</div>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            <ResendConfirmationsButton />
            <FixCreatorButton />
          </div>
        </div>
      </div>
    </div>
  )
}
