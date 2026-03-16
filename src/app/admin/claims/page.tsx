import { createClient } from '@supabase/supabase-js'
import ClaimActions from './ClaimActions'

export const dynamic = 'force-dynamic'

export default async function ClaimsPage() {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: claims } = await adminSupabase
    .from('creators')
    .select(`
      id,
      display_name,
      slug,
      youtube_url,
      instagram_url,
      tiktok_url,
      verification_code,
      claim_status,
      claim_requested_by,
      claimant:profiles!creators_claim_requested_by_fkey(username, email)
    `)
    .eq('claim_status', 'pending')
    .order('display_name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil-overtagelser</h1>
          <p className="text-sm text-gray-500 mt-0.5">Verificer at koden er i bio'en og godkend eller afvis</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${(claims?.length ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
          {claims?.length ?? 0} afventer
        </span>
      </div>

      {!claims?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-semibold text-gray-900">Ingen afventende overtagelser</div>
          <div className="text-sm text-gray-500 mt-1">Der er ingen profiler der venter på verificering</div>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim: any) => {
            const platforms = [
              claim.youtube_url && { name: 'YouTube', url: claim.youtube_url, color: 'red' },
              claim.instagram_url && { name: 'Instagram', url: claim.instagram_url, color: 'pink' },
              claim.tiktok_url && { name: 'TikTok', url: claim.tiktok_url, color: 'gray' },
            ].filter(Boolean) as { name: string; url: string; color: string }[]

            return (
              <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{claim.display_name}</span>
                        <span className="text-gray-400 text-sm">←</span>
                        <a
                          href={`/creators/${claim.slug}`}
                          target="_blank"
                          className="text-sm text-indigo-600 hover:underline font-mono"
                        >
                          /{claim.slug}
                        </a>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        Anmodet af <strong>@{(claim.claimant as any)?.username}</strong>
                        {' · '}
                        <span className="text-gray-400">{(claim.claimant as any)?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform links */}
                  {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {platforms.map((p) => (
                        <a
                          key={p.name}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Verification code */}
                  <div className="bg-gray-900 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Verifikationskode der skal stå i bio</div>
                      <code className="text-indigo-400 font-mono font-bold">{claim.verification_code}</code>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>Tjek bio'en</div>
                      <div>på alle platforme</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5">
                    <strong>Hvad skal du gøre:</strong> Klik på platformen ovenfor og tjek om koden <code className="font-mono bg-blue-100 px-1 rounded">{claim.verification_code}</code> er i bio'en. Godkend derefter eller afvis.
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <ClaimActions creatorId={claim.id} creatorName={claim.display_name} claimantEmail={(claim.claimant as any)?.email} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
