import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  const { data: topCreators } = await supabase
    .from('creators')
    .select('*')
    .order('average_rating', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a0f]">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCA0MCBBIDQ1IDQ1IDAgMCAwIDQwIDEwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        {/* Glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[80px]" />

        <div className="relative max-w-5xl mx-auto px-4 py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm text-white/70 text-xs font-medium px-4 py-1.5 rounded-full mb-10">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            {t('badge')}
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-[1.05] tracking-tight text-white">
            {t('headline1')}<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('headline2')}
            </span>
          </h1>

          <p className="text-lg text-white/50 mb-12 max-w-lg mx-auto leading-relaxed">
            {t('subtext')}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/creators"
              className="bg-white text-gray-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg text-sm"
            >
              {t('exploreBtn')}
            </Link>
            <Link
              href="/signup?role=creator"
              className="border border-white/15 bg-white/5 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 hover:border-white/25 transition-all text-sm backdrop-blur-sm"
            >
              {t('becomeCreatorBtn')} →
            </Link>
          </div>

          {/* Social proof numbers */}
          <div className="mt-16 flex items-center justify-center gap-10 flex-wrap">
            {[
              { value: '100%', label: t('freeDesc') },
              { value: '★★★★★', label: t('honestDesc') },
              { value: '🔒', label: t('safeDesc') },
            ].map(({ value, label }, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white/90">{value}</div>
                <div className="text-xs text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Top Creators */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{t('topRatedSubtitle')}</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('topRatedTitle')}</h2>
            </div>
            <Link
              href="/creators"
              className="text-sm font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              {t('seeAll')} →
            </Link>
          </div>

          {topCreators && topCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCreators.map((creator, i) => (
                <Link key={creator.id} href={`/creators/${creator.slug}`}>
                  <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300">
                    {/* Top ranked badge */}
                    {i < 3 && (
                      <div className="absolute top-4 right-4">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          #{i + 1}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200/50 flex-shrink-0">
                        <span className="text-white font-black text-xl">
                          {creator.display_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {creator.display_name}
                        </h3>
                        {creator.category && (
                          <span className="inline-block text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mt-0.5">
                            {creator.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {creator.bio && (
                      <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mb-4">{creator.bio}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <StarRating rating={creator.average_rating} size="sm" />
                      <div className="text-right">
                        <span className="text-lg font-black text-gray-900">{creator.average_rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 ml-1">({creator.review_count} {t('reviews')})</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="text-5xl mb-4">🌟</div>
              <p className="text-lg font-bold text-gray-700 mb-1">{t('noCreators')}</p>
              <p className="text-sm text-gray-400 mb-6">{t('beFirst')}</p>
              <Link href="/signup?role=creator" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-200">
                Opret creator profil →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{t('simpleAndFree')}</p>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('howItWorks')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                role: t('asViewer'),
                icon: '👁️',
                color: 'indigo',
                steps: [t('viewerStep1'), t('viewerStep2'), t('viewerStep3'), t('viewerStep4')],
              },
              {
                role: t('asCreator'),
                icon: '🎬',
                color: 'purple',
                steps: [t('creatorStep1'), t('creatorStep2'), t('creatorStep3'), t('creatorStep4')],
              },
            ].map(({ role, icon, color, steps }) => (
              <div key={role} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-7">
                  <span className="text-2xl">{icon}</span>
                  <h3 className="font-black text-gray-900 text-lg">{role}</h3>
                </div>
                <ul className="space-y-5">
                  {steps.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                        color === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-[13px] text-gray-600 leading-relaxed pt-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px]" />

        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{t('ctaTitle')}</h2>
          <p className="text-white/50 mb-10 text-lg">{t('ctaSubtext')}</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-gray-900 px-10 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-2xl shadow-black/30 text-sm"
          >
            {t('ctaBtn')} →
          </Link>
        </div>
      </section>
    </div>
  )
}
