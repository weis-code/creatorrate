'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

export default function CreatePlaceholderButton({ handle }: { handle: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('creators')
  const tCommon = useTranslations('common')

  const handleCreate = async () => {
    setLoading(true)
    const slug = handle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data: existing } = await supabase
      .from('creators')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existing) {
      router.push(`/creators/${existing.slug}`)
      return
    }

    const { error } = await supabase
      .from('creators')
      .insert({ user_id: null, display_name: handle, slug, is_claimed: false })

    if (error) {
      alert(tCommon('error') + ': ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/creators/${slug}`)
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {loading ? t('creating') : t('createProfileFor', { handle })}
    </button>
  )
}
