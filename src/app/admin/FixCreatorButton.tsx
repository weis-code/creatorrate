'use client'

import { useState } from 'react'

export default function FixCreatorButton() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  const handleFix = async () => {
    if (!email || state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/admin/fix-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setResult(data)
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-orange-50">
          🔧
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Ret creator-rolle manuelt</div>
          <div className="text-[11px] text-gray-400">Sæt en bruger til creator via email</div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setState('idle'); setResult(null) }}
          placeholder="bruger@email.dk"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={handleFix}
          disabled={!email || state === 'loading'}
          className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors font-medium"
        >
          {state === 'loading' ? '...' : 'Ret'}
        </button>
      </div>
      {result && (
        <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${state === 'done' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {state === 'done' ? (
            <>
              <p className="font-semibold">✓ {result.email} → creator (@{result.username})</p>
              <p>{result.note}</p>
            </>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
