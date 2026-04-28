import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.io'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-login',
          '/api/',
          '/dashboard',
          '/profile',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
