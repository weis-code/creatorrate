'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DisputeActions({ reviewId }: { reviewId: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()

  const handle = async (action: 'approve' | 'reject') => {
    setLoading(action)
    await fetch(`/api/admin/disputes/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <>
      <button
        onClick={() => handle('approve')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? (
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : '✓'}
        Approve (hide review)
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 bg-white text-red-600 border border-red-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        {loading === 'reject' ? (
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : '✗'}
        Reject (restore review)
      </button>
    </>
  )
}
