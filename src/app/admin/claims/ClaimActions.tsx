'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  creatorId: string
  creatorName: string
  claimantEmail: string
}

export default function ClaimActions({ creatorId, creatorName, claimantEmail }: Props) {
  const [state, setState] = useState<'idle' | 'confirming-approve' | 'confirming-reject' | 'loading'>('idle')
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()

  const handleApprove = async () => {
    setState('loading')
    await fetch(`/api/admin/claims/${creatorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    router.refresh()
  }

  const handleReject = async () => {
    setState('loading')
    await fetch(`/api/admin/claims/${creatorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason: rejectReason }),
    })
    router.refresh()
  }

  if (state === 'loading') {
    return <div className="text-sm text-gray-400 py-1">Behandler...</div>
  }

  if (state === 'confirming-approve') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-700">
          Bekræft godkendelse af <strong>{creatorName}</strong>?
        </span>
        <button
          onClick={handleApprove}
          className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          Ja, godkend
        </button>
        <button
          onClick={() => setState('idle')}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Annuller
        </button>
      </div>
    )
  }

  if (state === 'confirming-reject') {
    return (
      <div className="space-y-2.5 w-full">
        <div className="text-sm font-medium text-gray-700">Årsag til afvisning (valgfri):</div>
        <input
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="F.eks. koden var ikke i bio'en..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            Afvis anmodning
          </button>
          <button
            onClick={() => setState('idle')}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Annuller
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setState('confirming-approve')}
        className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Godkend
      </button>
      <button
        onClick={() => setState('confirming-reject')}
        className="flex items-center gap-1.5 text-sm bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 px-4 py-1.5 rounded-lg font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Afvis
      </button>
    </div>
  )
}
