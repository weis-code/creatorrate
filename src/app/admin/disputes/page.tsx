import { createClient } from '@/lib/supabase/server'
import DisputeActions from './DisputeActions'

export const dynamic = 'force-dynamic'

export default async function DisputesPage() {
  const supabase = await createClient()

  const { data: disputes } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      content,
      dispute_reason,
      created_at,
      creator:creators(display_name, slug),
      viewer:profiles!reviews_viewer_id_fkey(username, email)
    `)
    .eq('is_disputed', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disputed Reviews</h1>
        <span className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
          {disputes?.length ?? 0} pending
        </span>
      </div>

      {!disputes?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-semibold text-gray-900">No disputed reviews</div>
          <div className="text-sm text-gray-500 mt-1">All reviews are clean</div>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute: any) => (
            <div key={dispute.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">@{(dispute.viewer as any)?.username}</span>
                      <span className="text-gray-300">→</span>
                      <a href={`/creators/${(dispute.creator as any)?.slug}`} className="text-sm font-medium text-indigo-600 hover:underline">
                        {(dispute.creator as any)?.display_name}
                      </a>
                      <span className="text-yellow-500 text-sm">
                        {'★'.repeat(dispute.rating)}{'☆'.repeat(5 - dispute.rating)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded-xl p-3">{dispute.content}</p>
                    <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                      <span className="text-red-500 text-sm flex-shrink-0">🚩</span>
                      <div>
                        <div className="text-xs font-semibold text-red-700 mb-0.5">Dispute reason:</div>
                        <p className="text-sm text-red-700">{dispute.dispute_reason}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(dispute.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 flex items-center gap-3 flex-wrap">
                <DisputeActions reviewId={dispute.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
