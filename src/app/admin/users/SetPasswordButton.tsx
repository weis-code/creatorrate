'use client'

import { useState } from 'react'

export default function SetPasswordButton({ userId, username }: { userId: string; username: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSet = async () => {
    if (!password || state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/admin/users/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setState('done')
        setMessage('Password opdateret ✓')
        setTimeout(() => { setOpen(false); setState('idle'); setPassword(''); setMessage('') }, 1500)
      } else {
        setState('error')
        setMessage(data.error ?? 'Noget gik galt')
      }
    } catch {
      setState('error')
      setMessage('Netværksfejl')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
        title={`Sæt nyt password for @${username}`}
      >
        🔑 Password
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 items-end min-w-[200px]">
      <input
        type="password"
        value={password}
        onChange={e => { setPassword(e.target.value); setState('idle'); setMessage('') }}
        placeholder="Nyt password (min. 6 tegn)"
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSet(); if (e.key === 'Escape') setOpen(false) }}
      />
      <div className="flex gap-1.5 w-full">
        <button
          onClick={() => { setOpen(false); setPassword(''); setState('idle'); setMessage('') }}
          className="flex-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          Annuller
        </button>
        <button
          onClick={handleSet}
          disabled={!password || password.length < 6 || state === 'loading'}
          className="flex-1 text-xs bg-indigo-600 text-white px-2 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors font-medium"
        >
          {state === 'loading' ? '...' : 'Gem'}
        </button>
      </div>
      {message && (
        <div className={`text-[11px] w-full text-center rounded-lg px-2 py-1 ${state === 'done' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
