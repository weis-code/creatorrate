type Platform = 'youtube' | 'instagram' | 'tiktok'

interface ExtractedHandle {
  platform: Platform
  handle: string
}

export function extractHandle(url: string): ExtractedHandle | null {
  let parsed: URL
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return null
  }

  const hostname = parsed.hostname.replace(/^www\./, '')
  const pathname = parsed.pathname.replace(/\/$/, '') // strip trailing slash

  if (hostname === 'youtube.com' || hostname === 'youtu.be') {
    let handle: string | null = null
    if (pathname.startsWith('/@')) {
      handle = pathname.slice(2)
    } else if (pathname.startsWith('/c/')) {
      handle = pathname.slice(3)
    } else if (pathname.startsWith('/user/')) {
      handle = pathname.slice(6)
    } else {
      // bare /handle format
      const segment = pathname.slice(1)
      if (segment && !segment.includes('/')) handle = segment
    }
    if (!handle) return null
    return { platform: 'youtube', handle }
  }

  if (hostname === 'instagram.com') {
    const segment = pathname.slice(1).split('/')[0]
    if (!segment) return null
    return { platform: 'instagram', handle: segment }
  }

  if (hostname === 'tiktok.com' || hostname === 'vm.tiktok.com') {
    const segment = pathname.slice(1).split('/')[0]
    if (!segment) return null
    const handle = segment.startsWith('@') ? segment.slice(1) : segment
    return { platform: 'tiktok', handle }
  }

  return null
}

function normalizeForComparison(s: string): string {
  return s.toLowerCase().replace(/[-_.]/g, '')
}

interface PlatformUrls {
  youtube?: string
  instagram?: string
  tiktok?: string
}

export function validatePlatformUrls(urls: PlatformUrls, slug: string): string | null {
  const entries = [
    { key: 'youtube' as const, url: urls.youtube },
    { key: 'instagram' as const, url: urls.instagram },
    { key: 'tiktok' as const, url: urls.tiktok },
  ].filter((e) => e.url && e.url.trim() !== '')

  if (entries.length === 0) {
    return 'Du skal angive mindst ét platform-link (YouTube, Instagram eller TikTok)'
  }

  const platformNames: Record<Platform, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  }

  for (const entry of entries) {
    const result = extractHandle(entry.url!)
    if (!result) {
      return `Ugyldigt ${platformNames[entry.key]}-link. Brug formatet: youtube.com/@ditnavn`
    }
    if (normalizeForComparison(result.handle) !== normalizeForComparison(slug)) {
      return `Dit ${platformNames[result.platform]}-brugernavn "@${result.handle}" matcher ikke profil-URL'en "${slug}"`
    }
  }

  return null
}
