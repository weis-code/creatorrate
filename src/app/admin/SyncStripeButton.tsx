'use client'

import { useState } from 'react'

export default function SyncStripeButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [results, setResults] = useState<{ customer: string; status: string }[]>([])
  const [total, setTotal] = useState(0)

  const handleSync = async () => {
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/admin/sync-stripe', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setState('done')
        setResults(data.results ?? [])
        setTotal(data.total ?? 0)
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-green-50">
            💳
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Sync abonnementer fra Stripe</div>
            <div className="text-[11px] text-gray-400">Opdater DB med alle Stripe-betalinger</div>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={state === 'loading'}
          className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors font-medium flex-shrink-0"
        >
          {state === 'loading' ? '...' : 'Sync'}
        </button>
      </div>
      {state === 'done' && (
        <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 space-y-0.5 max-h-40 overflow-y-auto">
          <p className="font-semibold mb-1">{total} abonnementer fundet i Stripe:</p>
          {results.map((r, i) => (
            <p key={i}>{r.customer}: {r.status}</p>
          ))}
        </div>
      )}
      {state === 'error' && (
        <p className="mt-2 text-xs text-red-600">Noget gik galt. Prøv igen.</p>
      )}
    </div>
  )
}
