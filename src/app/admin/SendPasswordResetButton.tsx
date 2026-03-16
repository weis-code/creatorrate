'use client'

import { useState } from 'react'

export default function SendPasswordResetButton() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSend = async () => {
    if (!email || state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/admin/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setState('done')
        setMessage(`Reset-link sendt til ${data.email}`)
      } else {
        setState('error')
        setMessage(data.error ?? 'Noget gik galt')
      }
    } catch {
      setState('error')
      setMessage('Netværksfejl')
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-blue-50">
          🔑
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Send password reset</div>
          <div className="text-[11px] text-gray-400">Send reset-link til en bruger via email</div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setState('idle'); setMessage('') }}
          placeholder="bruger@email.dk"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSend}
          disabled={!email || state === 'loading'}
          className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium"
        >
          {state === 'loading' ? '...' : 'Send'}
        </button>
      </div>
      {message && (
        <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${state === 'done' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {state === 'done' ? `✓ ${message}` : message}
        </div>
      )}
    </div>
  )
}
