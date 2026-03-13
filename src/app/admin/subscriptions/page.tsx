import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:   { label: 'Aktiv',       className: 'bg-green-100 text-green-700' },
  trialing: { label: 'Trial',       className: 'bg-blue-100 text-blue-700' },
  past_due: { label: 'Forfalden',   className: 'bg-orange-100 text-orange-700' },
  canceled: { label: 'Annulleret',  className: 'bg-gray-100 text-gray-500' },
}

export default async function SubscriptionsPage() {
  const supabase = createAdminClient()

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      id,
      tier,
      status,
      current_period_end,
      stripe_subscription_id,
      created_at,
      creator:creators(display_name, slug)
    `)
    .order('created_at', { ascending: false })

  const activeCount = subscriptions?.filter(s => s.status === 'active').length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abonnementer</h1>
        <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
          {activeCount} aktive
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Creator</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Plan</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Udløber</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Oprettet</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions?.map((sub) => {
              const status = STATUS_LABEL[sub.status] ?? { label: sub.status, className: 'bg-gray-100 text-gray-500' }
              return (
                <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <a
                      href={`/creators/${(sub.creator as any)?.slug}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {(sub.creator as any)?.display_name ?? '—'}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      sub.tier === 'pro'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sub.tier === 'pro' ? '⚡ Pro' : '· Basic'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(sub.current_period_end).toLocaleDateString('da-DK')}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(sub.created_at).toLocaleDateString('da-DK')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!subscriptions?.length && (
          <div className="py-12 text-center text-gray-400">Ingen abonnementer endnu</div>
        )}
      </div>
    </div>
  )
}
