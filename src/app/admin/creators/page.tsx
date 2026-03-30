import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminCreatorsPage() {
  const supabase = createAdminClient()

  const [{ data: creators }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('creators')
      .select('id, user_id, display_name, slug, bio, youtube_url, instagram_url, tiktok_url, is_claimed, created_at, avatar_url')
      .order('created_at', { ascending: false }),
    supabase
      .from('subscriptions')
      .select('creator_id, tier, status'),
  ])

  const subMap = new Map(subscriptions?.map(s => [s.creator_id, s]) ?? [])

  // Get emails for claimed creators
  const claimedUserIds = creators?.filter(c => c.user_id).map(c => c.user_id!) ?? []
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, username')
    .in('id', claimedUserIds.length > 0 ? claimedUserIds : ['00000000-0000-0000-0000-000000000000'])

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

  const incomplete = creators?.filter(c => c.is_claimed && (!c.youtube_url && !c.instagram_url && !c.tiktok_url)).length ?? 0
  const unclaimed = creators?.filter(c => !c.is_claimed).length ?? 0

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Creators</h1>
          <p className="text-sm text-gray-400 mt-1">Administrer creator-profiler direkte</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold">
            🎬 {creators?.length ?? 0} i alt
          </div>
          {incomplete > 0 && (
            <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-sm font-semibold">
              ⚠ {incomplete} ufuldstændige
            </div>
          )}
          {unclaimed > 0 && (
            <div className="bg-gray-50 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold">
              🔓 {unclaimed} unclaimed
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Creator</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Email</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Abonnement</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Setup</th>
              <th className="text-left px-6 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Status</th>
              <th className="px-6 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {creators?.map((creator) => {
              const sub = subMap.get(creator.id)
              const profile = creator.user_id ? profileMap.get(creator.user_id) : null
              const hasLinks = !!(creator.youtube_url || creator.instagram_url || creator.tiktok_url)
              const hasBio = !!creator.bio?.trim()
              const setupScore = [hasLinks, hasBio, !!creator.avatar_url].filter(Boolean).length

              return (
                <tr key={creator.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {creator.display_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{creator.display_name}</div>
                        <div className="text-xs text-gray-400">/{creator.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{profile?.email ?? '—'}</td>
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
                    ) : creator.is_claimed ? (
                      <span className="text-xs text-orange-400 font-medium">⚠ Mangler</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span title="Platform-links" className={hasLinks ? 'text-green-500' : 'text-gray-200'}>🔗</span>
                      <span title="Bio" className={hasBio ? 'text-green-500' : 'text-gray-200'}>📝</span>
                      <span title="Profilbillede" className={creator.avatar_url ? 'text-green-500' : 'text-gray-200'}>🖼</span>
                      <span className={`ml-1 text-xs font-medium ${setupScore === 3 ? 'text-green-600' : setupScore >= 1 ? 'text-orange-400' : 'text-red-400'}`}>
                        {setupScore}/3
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {creator.is_claimed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium">✓ Claimed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-50 text-gray-400 text-xs font-medium">Unclaimed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/creators/${creator.slug}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Se profil ↗
                      </Link>
                      <Link
                        href={`/admin/creators/${creator.id}`}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Rediger
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!creators?.length && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-3xl mb-2">🎬</div>
            <p className="text-sm">Ingen creators endnu</p>
          </div>
        )}
      </div>
    </div>
  )
}
