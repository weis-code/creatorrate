import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { blogPosts, getBlogPost } from '@/lib/blog'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.io'

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}

  const url = `${APP_URL}/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    keywords: [post.keyword, 'creators', 'anmeldelser', 'creatorrate'],
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.date,
      siteName: 'CreatorRate',
      images: [{ url: `${APP_URL}/logo.svg`, width: 512, height: 512, alt: 'CreatorRate' }],
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const postUrl = `${APP_URL}/blog/${post.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: postUrl,
    author: {
      '@type': 'Organization',
      name: 'CreatorRate',
      url: APP_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CreatorRate',
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  }

  const otherPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600 transition-colors">Hjem</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-600 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {post.readTime} læsning
            </span>
            <span className="text-xs text-gray-400">
              {new Date(post.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            {post.description}
          </p>
        </header>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent mb-10" />

        {/* Content */}
        <article className="prose prose-gray max-w-none">
          {post.sections.map((section, i) => (
            <div key={i} className="mb-8">
              {section.heading && (
                <h2 className="text-xl font-bold text-gray-900 mb-3 mt-8">
                  {section.heading}
                </h2>
              )}
              {section.body.split('\n\n').map((paragraph, j) => (
                <p
                  key={j}
                  className="text-gray-600 leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: paragraph }}
                />
              ))}
            </div>
          ))}
        </article>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-7 text-white text-center">
          <div className="text-3xl mb-3">⭐</div>
          <h2 className="text-lg font-bold mb-2">Find og anmeld din favorit-creator</h2>
          <p className="text-indigo-200 text-sm mb-5">
            Hjælp fællesskabet med ærlige anmeldelser — og opdag creators du ikke kendte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/creators"
              className="bg-white text-indigo-600 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm text-sm"
            >
              Se alle creators →
            </Link>
            <Link
              href="/signup"
              className="bg-white/10 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors text-sm border border-white/20"
            >
              Opret konto gratis
            </Link>
          </div>
        </div>

        {/* Related posts */}
        {otherPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Flere artikler</h2>
            <div className="space-y-4">
              {otherPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-100 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {related.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{related.readTime} læsning</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tilbage til blog
          </Link>
        </div>
      </div>
    </div>
  )
}
