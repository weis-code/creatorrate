import { createAdminClient } from '@/lib/supabase/admin'
import DeleteUserButton from './DeleteUserButton'
import SetPasswordButton from './SetPasswordButton'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = createAdminClient()

  const [{ data: users }, { data: subscriptions }, { data: creatorRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, username, role, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('subscriptions')
      .select('creator_id, tier, status'),
    supabase
      .from('creators')
      .select('id, user_id'),
  ])

  // Map creator_id → subscription
  const subByCreatorId = new Map(subscriptions?.map(s => [s.creator_id, s]) ?? [])
  // Map user_id → creator_id (handles unclaimed profile takeovers where creator.id ≠ user.id)
  const creatorIdByUserId = new Map(creatorRows?.filter(c => c.user_id).map(c => [c.user_id, c.id]) ?? [])
  // Final map: user.id → subscription
  const subMap = new Map(
    [...creatorIdByUserId.entries()].map(([userId, creatorId]) => [userId, subByCreatorId.get(creatorId)])
  )

  const creators = users?.filter(u => u.role === 'creator').length ?? 0
  const viewers = users?.filter(u => u.role === 'viewer').length ?? 0

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Brugere</h1>
          <p className="text-sm text-gray-400 mt-1">Alle registrerede brugere på platformen</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold">
            🎬 {creators} creators
          </div>
          <div className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold">
            👀 {viewers} viewers
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Bruger</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Email</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Rolle</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Abonnement</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Oprettet</th>
              <th className="px-6 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users?.map((user) => {
              const sub = subMap.get(user.id)
              return (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-semibold text-gray-900">@{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      user.role === 'creator'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-gray-50 text-gray-500'
                    }`}>
                      {user.role === 'creator' ? '🎬' : '👀'} {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sub ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        sub.status === 'active'
                          ? sub.tier?.toUpperCase() === 'PRO'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {sub.status === 'active' ? (sub.tier?.toUpperCase() === 'PRO' ? '⚡ Pro' : '· Basic') : `${sub.tier} (${sub.status})`}
                      </span>
                    ) : (
                      user.role === 'creator'
                        ? <span className="text-xs text-orange-400 font-medium">⚠ Mangler</span>
                        : <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <SetPasswordButton userId={user.id} username={user.username ?? ''} />
                      <DeleteUserButton userId={user.id} username={user.username ?? user.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!users?.length && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">Ingen brugere endnu</p>
          </div>
        )}
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-50 text-xs text-gray-400">
          Viser {users?.length ?? 0} brugere (max 200)
        </div>
      </div>
    </div>
  )
}
