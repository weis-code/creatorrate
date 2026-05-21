import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StarRating from '@/components/StarRating'
import CreatePlaceholderButton from '@/components/CreatePlaceholderButton'
import CreatorAvatar from '@/components/CreatorAvatar'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Find creators',
  description: 'Søg og find anmeldelser af danske YouTubere, TikTokere, Instagrammers og andre creators. Se hvad rigtige seere siger.',
  openGraph: {
    title: 'Find creators — CreatorRate',
    description: 'Søg og find anmeldelser af danske creators. Se hvad rigtige seere siger.',
    url: '/creators',
    type: 'website',
  },
}

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('creators')

  const rawQuery = params.q ?? ''
  const searchTerm = rawQuery.startsWith('@') ? rawQuery.slice(1) : rawQuery

  let query = supabase
    .from('creators')
    .select('*')
    .order('review_count', { ascending: false })

  if (searchTerm) {
    query = query.or(`display_name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)
  }
  if (params.category) {
    query = query.eq('category', params.category)
  }

  const { data: creators } = await query

  const categories = ['Gaming', 'Lifestyle', 'Tech', 'Beauty', 'Fitness', 'Mad', 'Musik', 'Podcast', 'Andet']

  return (
    <div className="min-h-screen bg-white">

      {/* Dark header */}
      <div className="bg-[#08080f]">
        <div className="relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-700/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-10">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Udforsk</p>
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('title')}</h1>
            <p className="text-white/40 text-sm mb-8">{t('subtitle')}</p>

            {/* Search & filters */}
            <form className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <select
                name="category"
                defaultValue={params.category}
                className="bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                <option value="" className="bg-gray-900 text-white">{t('allCategories')}</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/30"
              >
                {t('searchBtn')}
              </button>
            </form>

            {/* Active category filter pill */}
            {params.category && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-white/30">{t('filtered')}</span>
                <Link href="/creators" className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium px-3 py-1 rounded-full hover:bg-indigo-500/30 transition-colors">
                  {params.category}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Gradient fade */}
        <div className="h-14 bg-gradient-to-b from-[#08080f] to-white" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">

        {/* Not found + placeholder CTA */}
        {(!creators || creators.length === 0) && searchTerm && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mb-8 shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-700 font-semibold mb-1">
              {t('notFoundMsg')} <span className="text-indigo-600 font-black">@{searchTerm}</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">{t('notFoundSub')}</p>
            <CreatePlaceholderButton handle={searchTerm} />
          </div>
        )}

        {creators && creators.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
              {creators.length === 1 ? t('found', { count: creators.length }) : t('foundPlural', { count: creators.length })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creators.map((creator) => (
                <Link key={creator.id} href={`/creators/${creator.slug}`}>
                  <div className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <CreatorAvatar displayName={creator.display_name} avatarUrl={creator.avatar_url} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors text-[15px]">
                            {creator.display_name}
                          </h3>
                          {!creator.is_claimed && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex-shrink-0 font-semibold">
                              {t('notClaimed')}
                            </span>
                          )}
                        </div>
                        {creator.category && (
                          <span className="inline-block text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                            {creator.category}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <StarRating rating={creator.average_rating} size="sm" />
                          <span className="text-xs text-gray-700 font-semibold">
                            {creator.average_rating > 0 ? creator.average_rating.toFixed(1) : t('noRating')}
                          </span>
                          <span className="text-xs text-gray-400">({creator.review_count})</span>
                        </div>
                      </div>
                    </div>
                    {creator.bio && (
                      <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed">{creator.bio}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : !searchTerm ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg font-black text-gray-800 tracking-tight mb-1">{t('noCreators')}</p>
            <p className="text-sm text-gray-400">{t('noCreatorsSub')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
