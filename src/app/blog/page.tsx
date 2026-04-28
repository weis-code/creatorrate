import Link from 'next/link'
import type { Metadata } from 'next'
import { blogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog — Creator tips og indsigt',
  description: 'Læs vores artikler om creators, anmeldelser, sponsorater og influencer marketing. Få indsigt der hjælper dig med at træffe bedre valg.',
  openGraph: {
    title: 'Blog — CreatorRate',
    description: 'Artikler om creators, anmeldelser og influencer marketing.',
    url: '/blog',
    type: 'website',
  },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            ✍️ CreatorRate Blog
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
            Tips, indsigt og guides om creators
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Alt hvad du behøver at vide om at finde, vurdere og samarbejde med creators — baseret på rigtige seer-data.
          </p>
        </div>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {post.readTime} læsning
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(post.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {post.description}
              </p>

              <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:gap-2.5 transition-all">
                Læs artikel
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <div className="text-3xl mb-3">⭐</div>
          <h2 className="text-xl font-bold mb-2">Har du anmeldt din favorit-creator endnu?</h2>
          <p className="text-indigo-200 text-sm mb-5">Hjælp andre seere med at træffe bedre valg — skriv en ærlig anmeldelse i dag.</p>
          <Link
            href="/creators"
            className="inline-block bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Find en creator at anmelde →
          </Link>
        </div>
      </div>
    </div>
  )
}
