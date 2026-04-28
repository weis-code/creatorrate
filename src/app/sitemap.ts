import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { blogPosts } from '@/lib/blog'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.io'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: creators } = await supabase
    .from('creators')
    .select('slug, updated_at')
    .order('created_at', { ascending: false })

  const creatorUrls: MetadataRoute.Sitemap = (creators ?? []).map((c) => ({
    url: `${APP_URL}/creators/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/creators`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    {
      url: `${APP_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...creatorUrls,
  ]
}
