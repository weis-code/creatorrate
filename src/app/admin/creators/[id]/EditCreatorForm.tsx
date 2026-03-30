'use client'
import { useState } from 'react'

interface Creator {
  id: string
  display_name: string
  slug: string
  bio: string | null
  youtube_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  avatar_url: string | null
  category: string | null
}

export default function EditCreatorForm({ creator }: { creator: Creator }) {
  const [form, setForm] = useState({
    display_name: creator.display_name ?? '',
    slug: creator.slug ?? '',
    bio: creator.bio ?? '',
    youtube_url: creator.youtube_url ?? '',
    instagram_url: creator.instagram_url ?? '',
    tiktok_url: creator.tiktok_url ?? '',
    avatar_url: creator.avatar_url ?? '',
    category: creator.category ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    const res = await fetch(`/api/admin/creators/${creator.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) setError(data.error)
    else setSaved(true)
  }

  const fields = [
    { key: 'display_name', label: 'Navn', type: 'text' },
    { key: 'slug', label: 'Slug (profil-URL)', type: 'text' },
    { key: 'category', label: 'Kategori', type: 'text' },
    { key: 'avatar_url', label: 'Profilbillede URL', type: 'text' },
    { key: 'youtube_url', label: 'YouTube URL', type: 'text' },
    { key: 'instagram_url', label: 'Instagram URL', type: 'text' },
    { key: 'tiktok_url', label: 'TikTok URL', type: 'text' },
  ] as const

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-bold text-gray-900">Rediger profil</h2>

      <div className="grid grid-cols-2 gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
            <input
              type="text"
              value={form[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Gemmer...' : 'Gem ændringer'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Gemt!</span>}
      </div>
    </div>
  )
}
