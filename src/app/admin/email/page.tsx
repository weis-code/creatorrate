'use client'

import { useState } from 'react'

const AUDIENCES = [
  { value: 'all', label: 'Alle brugere', desc: 'Creators + viewers', icon: '👥' },
  { value: 'creators', label: 'Kun creators', desc: 'Betalende creators', icon: '🎬' },
  { value: 'viewers', label: 'Kun seere', desc: 'Gratis viewer-konti', icon: '👀' },
]

export default function AdminEmailPage() {
  const [audience, setAudience] = useState('all')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [preview, setPreview] = useState(false)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const html = body
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px;line-height:1.6;color:#374151;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:4px;">
        <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-weight:700;font-size:11px;">CR</span>
        </div>
        <span style="color:white;font-weight:700;font-size:16px;">CreatorRate</span>
      </div>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px;">${subject || 'Emne...'}</h2>
      ${html || '<p style="color:#9ca3af;">Skriv din besked...</p>'}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">Du modtager denne mail fordi du er registreret på CreatorRate.<br/>© ${new Date().getFullYear()} CreatorRate</p>
    </div>
  </div>
</body>
</html>`

  const handleSend = async () => {
    if (!confirmed) return
    setState('loading')
    setError('')

    const res = await fetch('/api/admin/send-mass-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, html: fullHtml, audience }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Noget gik galt')
      setState('error')
    } else {
      setResult(data)
      setState('done')
    }
    setConfirmed(false)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Send nyhedsmail</h1>
        <p className="text-sm text-gray-400 mt-1">Skriv og send en mail til dine brugere</p>
      </div>

      {state === 'done' && result && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-green-700 font-bold mb-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            Mail sendt!
          </div>
          <p className="text-sm text-green-600">{result.sent} sendt · {result.failed} fejlede · {result.total} modtagere i alt</p>
          <button onClick={() => { setState('idle'); setResult(null); setSubject(''); setBody('') }} className="mt-3 text-sm text-green-700 underline">
            Send en ny mail
          </button>
        </div>
      )}

      {state !== 'done' && (
        <>
          {/* Audience */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h2 className="font-bold text-gray-900 text-sm">Modtagere</h2>
            <div className="grid grid-cols-3 gap-3">
              {AUDIENCES.map(a => (
                <button
                  key={a.value}
                  onClick={() => setAudience(a.value)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${audience === a.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                >
                  <div className="text-xl mb-1">{a.icon}</div>
                  <div className="text-sm font-bold text-gray-900">{a.label}</div>
                  <div className="text-xs text-gray-400">{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm">Besked</h2>
              <button
                onClick={() => setPreview(!preview)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
              >
                {preview ? '✏️ Rediger' : '👁 Forhåndsvis'}
              </button>
            </div>

            {preview ? (
              <div
                className="border border-gray-200 rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: fullHtml }}
              />
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emne</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="fx. Nyhed fra CreatorRate 🎉"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Besked <span className="normal-case font-normal text-gray-400">(brug tomme linjer til afsnit)</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Hej alle sammen,&#10;&#10;Vi har spændende nyheder at dele..."
                    rows={10}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Send */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 text-sm">Afsend</h2>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-600">
                Jeg bekræfter at jeg vil sende denne mail til <strong>{AUDIENCES.find(a => a.value === audience)?.label.toLowerCase()}</strong>
              </span>
            </label>

            <button
              onClick={handleSend}
              disabled={!confirmed || !subject.trim() || !body.trim() || state === 'loading'}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Sender...
                </>
              ) : `Send til ${AUDIENCES.find(a => a.value === audience)?.label.toLowerCase()}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
