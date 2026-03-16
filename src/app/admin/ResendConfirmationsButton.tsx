'use client'

import { useState } from 'react'

export default function ResendConfirmationsButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ total: number; results: { email: string; status: string }[] } | null>(null)

  const handleClick = async () => {
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/admin/resend-all-confirmations', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setState('error')
      } else {
        setResult(data)
        setState('done')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'done' && result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
        <p className="font-semibold text-green-700 mb-1">✓ Sendt til {result.total} brugere</p>
        <div className="space-y-0.5">
          {result.results.map(r => (
            <p key={r.email} className="text-xs text-green-600">{r.email} — {r.status}</p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group w-full text-left disabled:opacity-50"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-amber-50">
          📧
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            Gensend bekræftelsesmails
          </div>
          <div className="text-[11px] text-gray-400">
            {state === 'loading' ? 'Sender...' : 'Til alle ikke-bekræftede brugere'}
          </div>
        </div>
        {state === 'loading' && (
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
      </button>
      {state === 'error' && (
        <p className="text-xs text-red-500 px-3 pb-2">Noget gik galt. Prøv igen.</p>
      )}
    </div>
  )
}
