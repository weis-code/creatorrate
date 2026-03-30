import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditCreatorForm from './EditCreatorForm'

export const dynamic = 'force-dynamic'

export default async function AdminCreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: creator }, { data: sub }, { data: reviews }] = await Promise.all([
    supabase.from('creators').select('*').eq('id', id).single(),
    supabase.from('subscriptions').select('tier, status, current_period_end').eq('creator_id', id).maybeSingle(),
    supabase.from('reviews').select('id, rating, content, created_at, viewer:profiles(username)').eq('creator_id', id).order('created_at', { ascending: false }),
  ])

  if (!creator) notFound()

  const profile = creator.user_id
    ? await supabase.from('profiles').select('email, username').eq('id', creator.user_id).single().then(r => r.data)
    : null

  const avgRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/creators" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Creators
          </Link>
          <div className="flex items-center gap-3">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {creator.display_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-gray-900">{creator.display_name}</h1>
              <p className="text-sm text-gray-400">/{creator.slug}</p>
            </div>
          </div>
        </div>
        <Link
          href={`/creators/${creator.slug}`}
          target="_blank"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Se profil ↗
        </Link>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-gray-900">{reviews?.length ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">Anmeldelser</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="text-2xl font-black text-gray-900">{avgRating ?? '—'}</div>
          <div className="text-xs text-gray-400 mt-1">Snit rating</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className={`text-sm font-bold ${sub?.status === 'active' ? 'text-green-600' : 'text-orange-400'}`}>
            {sub ? `${sub.tier} (${sub.status})` : 'Intet abo'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Abonnement</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <div className={`text-sm font-bold ${creator.is_claimed ? 'text-green-600' : 'text-gray-400'}`}>
            {creator.is_claimed ? '✓ Claimed' : 'Unclaimed'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Status</div>
          {profile?.email && <div className="text-xs text-gray-500 mt-1 truncate">{profile.email}</div>}
        </div>
      </div>

      {/* Edit form */}
      <EditCreatorForm creator={creator} />

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Anmeldelser ({reviews?.length ?? 0})</h2>
        </div>
        {reviews?.length ? (
          <div className="divide-y divide-gray-50">
            {reviews.map((review) => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">@{(review.viewer as any)?.username ?? 'anonym'}</span>
                    <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{review.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400 text-sm">Ingen anmeldelser endnu</div>
        )}
      </div>
    </div>
  )
}
