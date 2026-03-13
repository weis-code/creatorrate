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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
            {t('badge')}
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            {t('headline1')}<br />
            <span className="text-yellow-300">{t('headline2')}</span>
          </h1>
          <p className="text-lg text-indigo-100 mb-10 max-w-xl mx-auto leading-relaxed">
            {t('subtext')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/creators"
              className="bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10"
            >
              {t('exploreBtn')}
            </Link>
            <Link
              href="/signup?role=creator"
              className="border-2 border-white/60 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-colors"
            >
              {t('becomeCreatorBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: t('free'), label: t('freeDesc'), icon: '🎯' },
              { value: t('honest'), label: t('honestDesc'), icon: '✅' },
              { value: t('safe'), label: t('safeDesc'), icon: '🔒' },
            ].map(({ value, label, icon }) => (
              <div key={value} className="group">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Creators */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('topRatedTitle')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('topRatedSubtitle')}</p>
            </div>
            <Link href="/creators" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors">
              {t('seeAll')}
            </Link>
          </div>

          {topCreators && topCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topCreators.map((creator, i) => (
                <Link key={creator.id} href={`/creators/${creator.slug}`}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-lg">
                            {creator.display_name[0].toUpperCase()}
                          </span>
                        </div>
                        {i < 3 && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900 shadow">
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {creator.display_name}
                        </h3>
                        {creator.category && (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {creator.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={creator.average_rating} size="sm" />
                      <span className="text-sm text-gray-600 font-medium">
                        {creator.average_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">({creator.review_count} {t('reviews')})</span>
                    </div>
                    {creator.bio && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">{creator.bio}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🌟</div>
              <p className="text-lg font-medium text-gray-700 mb-2">{t('noCreators')}</p>
              <Link href="/signup?role=creator" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                {t('beFirst')}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">{t('howItWorks')}</h2>
            <p className="text-gray-500 mt-2 text-sm">{t('simpleAndFree')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                role: t('asViewer'),
                color: 'indigo',
                bg: 'bg-indigo-50',
                border: 'border-indigo-100',
                badge: 'bg-indigo-600',
                steps: [t('viewerStep1'), t('viewerStep2'), t('viewerStep3'), t('viewerStep4')],
              },
              {
                role: t('asCreator'),
                color: 'purple',
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                badge: 'bg-purple-600',
                steps: [t('creatorStep1'), t('creatorStep2'), t('creatorStep3'), t('creatorStep4')],
              },
            ].map(({ role, color, bg, border, badge, steps }) => (
              <div key={role} className={`${bg} ${border} border rounded-2xl p-8`}>
                <div className={`inline-flex items-center gap-2 ${badge} text-white text-xs font-semibold px-3 py-1 rounded-full mb-5`}>
                  {role}
                </div>
                <ul className="space-y-4">
                  {steps.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                      <span className={`w-6 h-6 ${badge} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-3">{t('ctaTitle')}</h2>
          <p className="text-indigo-200 mb-8">{t('ctaSubtext')}</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-indigo-700 px-10 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            {t('ctaBtn')}
          </Link>
        </div>
      </section>
    </div>
  )
}
