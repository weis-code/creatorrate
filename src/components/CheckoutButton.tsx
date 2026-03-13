'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  priceId: string
  tier: 'basic' | 'pro'
  creatorId: string | null
}

export default function CheckoutButton({ priceId, tier, creatorId }: Props) {
  const [loading, setLoading] = useState(false)
  const t = useTranslations('subscription')
  const tCommon = useTranslations('common')

  const handleCheckout = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, tier, creatorId }),
    })
    const { url, error } = await res.json()
    if (error) { alert(tCommon('error') + ': ' + error); setLoading(false); return }
    window.location.href = url
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {loading ? tCommon('loading') : t('choosePlan', { tier: tier === 'pro' ? 'Pro' : 'Basic' })}
    </button>
  )
}
