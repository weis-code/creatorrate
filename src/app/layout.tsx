import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SupportChat from '@/components/SupportChat'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.io'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'CreatorRate — Anmeld dine favorit creators',
    template: '%s | CreatorRate',
  },
  description: 'Trustpilot for creators. Læs og skriv anmeldelser af YouTubere, TikTokere og andre creators baseret på rigtige seeres oplevelser.',
  keywords: ['creator anmeldelser', 'youtube anmeldelser', 'tiktok anmeldelser', 'creator rating', 'influencer anmeldelser'],
  authors: [{ name: 'CreatorRate', url: APP_URL }],
  creator: 'CreatorRate',
  openGraph: {
    type: 'website',
    locale: 'da_DK',
    url: APP_URL,
    siteName: 'CreatorRate',
    title: 'CreatorRate — Anmeld dine favorit creators',
    description: 'Trustpilot for creators. Læs og skriv anmeldelser af YouTubere, TikTokere og andre creators.',
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'CreatorRate' }],
  },
  twitter: {
    card: 'summary',
    title: 'CreatorRate — Anmeld dine favorit creators',
    description: 'Trustpilot for creators. Læs og skriv anmeldelser af YouTubere, TikTokere og andre creators.',
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main>{children}</main>
          <SupportChat />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
