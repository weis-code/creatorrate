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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-gray-500 text-sm">{t('subtitle')}</p>

          {/* Search & filters */}
          <form className="flex gap-3 mt-5 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                defaultValue={params.q}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <select
              name="category"
              defaultValue={params.category}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
            >
              {t('searchBtn')}
            </button>
          </form>

          {/* Active category filter pills */}
          {params.category && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">{t('filtered')}</span>
              <Link href="/creators" className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors">
                {params.category}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Not found + placeholder CTA */}
        {(!creators || creators.length === 0) && searchTerm && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 mb-8 shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-700 font-medium mb-1">
              {t('notFoundMsg')} <span className="text-indigo-600 font-bold">@{searchTerm}</span>
            </p>
            <p className="text-sm text-gray-400 mb-6">{t('notFoundSub')}</p>
            <CreatePlaceholderButton handle={searchTerm} />
          </div>
        )}

        {creators && creators.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {creators.length === 1 ? t('found', { count: creators.length }) : t('foundPlural', { count: creators.length })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creators.map((creator) => (
                <Link key={creator.id} href={`/creators/${creator.slug}`}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start gap-4">
                      <CreatorAvatar displayName={creator.display_name} avatarUrl={creator.avatar_url} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {creator.display_name}
                          </h3>
                          {!creator.is_claimed && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                              {t('notClaimed')}
                            </span>
                          )}
                        </div>
                        {creator.category && (
                          <span className="inline-block text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
                            {creator.category}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <StarRating rating={creator.average_rating} size="sm" />
                          <span className="text-xs text-gray-600 font-medium">
                            {creator.average_rating > 0 ? creator.average_rating.toFixed(1) : t('noRating')}
                          </span>
                          <span className="text-xs text-gray-400">({creator.review_count})</span>
                        </div>
                      </div>
                    </div>
                    {creator.bio && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">{creator.bio}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : !searchTerm ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg font-medium text-gray-700 mb-1">{t('noCreators')}</p>
            <p className="text-sm text-gray-400">{t('noCreatorsSub')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
