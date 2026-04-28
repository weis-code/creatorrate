import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'CreatorRate — Anmeld dine favorit creators',
  description: 'Trustpilot for creators. Find og anmeld YouTubere, TikTokere og andre danske creators baseret på rigtige seeres oplevelser.',
  openGraph: {
    title: 'CreatorRate — Anmeld dine favorit creators',
    description: 'Trustpilot for creators. Find og anmeld YouTubere, TikTokere og andre danske creators.',
    url: '/',
    type: 'website',
  },
}

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

      {/* Hero + Creator cards — unified dark section */}
      <div className="bg-[#08080f]">

        {/* Hero */}
        <section className="relative overflow-hidden pt-24 pb-16">
          {/* Ambient glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-700/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs font-medium px-4 py-1.5 rounded-full mb-10">
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

            <p className="text-lg text-white/40 mb-10 max-w-md mx-auto leading-relaxed">
              {t('subtext')}
            </p>

            <div className="flex justify-center mb-16">
              <Link
                href="/creators"
                className="bg-white text-gray-900 px-10 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg text-sm"
              >
                {t('exploreBtn')} →
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-10 flex-wrap">
              {[
                { value: '100%', label: t('freeDesc') },
                { value: '★ ★ ★ ★ ★', label: t('honestDesc') },
                { value: '🔒', label: t('safeDesc') },
              ].map(({ value, label }, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold text-white/80">{value}</div>
                  <div className="text-xs text-white/30 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Creators — still inside dark section */}
        <section className="pb-6 pt-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">{t('topRatedSubtitle')}</p>
                <h2 className="text-2xl font-black text-white tracking-tight">{t('topRatedTitle')}</h2>
              </div>
              <Link href="/creators" className="text-sm font-semibold text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
                {t('seeAll')} →
              </Link>
            </div>

            {topCreators && topCreators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCreators.map((creator, i) => (
                  <Link key={creator.id} href={`/creators/${creator.slug}`}>
                    <div className="group relative bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5">
                      {i < 3 && (
                        <div className="absolute top-4 right-4">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                            i === 0 ? 'bg-yellow-400/15 text-yellow-400' :
                            i === 1 ? 'bg-white/10 text-white/50' :
                            'bg-orange-400/15 text-orange-400'
                          }`}>#{i + 1}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3.5 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/30">
                          <span className="text-white font-black text-lg">
                            {creator.display_name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate group-hover:text-indigo-300 transition-colors text-[15px]">
                            {creator.display_name}
                          </h3>
                          {creator.category && (
                            <span className="text-[11px] font-medium text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                              {creator.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {creator.bio && (
                        <p className="text-[12px] text-white/40 line-clamp-2 mb-3 leading-relaxed">{creator.bio}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <StarRating rating={creator.average_rating} size="sm" />
                        <div>
                          <span className="text-base font-black text-white/90">{creator.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-white/30 ml-1">({creator.review_count})</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/3 rounded-3xl border border-white/8">
                <div className="text-5xl mb-4">🌟</div>
                <p className="text-lg font-bold text-white/70 mb-1">{t('noCreators')}</p>
                <p className="text-sm text-white/30 mb-6">{t('beFirst')}</p>
                <Link href="/signup?role=creator" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-500 transition-all">
                  Opret creator profil →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Gradient fade from dark to white */}
        <div className="h-40 bg-gradient-to-b from-[#08080f] via-[#08080f]/60 to-white" />
      </div>

      {/* How it works — light section */}
      <section className="py-20">
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
              <div key={role} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
                      <span className="text-[13px] text-gray-500 leading-relaxed pt-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#08080f] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{t('ctaTitle')}</h2>
          <p className="text-white/40 mb-10 text-base">{t('ctaSubtext')}</p>
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
