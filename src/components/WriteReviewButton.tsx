'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  creatorId: string
  creatorSlug: string
}

export default function WriteReviewButton({ creatorId, creatorSlug }: Props) {
  const router = useRouter()
  const t = useTranslations('creatorDetail')
  return (
    <button
      onClick={() => router.push(`/creators/${creatorSlug}/review`)}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
    >
      {t('writeReview')}
    </button>
  )
}
