'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteUserButton({ userId, username }: { userId: string; username: string }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 4000) // reset after 4s
      return
    }

    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })

    if (res.ok) {
      router.refresh()
    } else {
      const { error } = await res.json()
      alert('Fejl: ' + error)
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
        confirm
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-red-50 text-red-500 hover:bg-red-100'
      } disabled:opacity-50`}
    >
      {loading ? '...' : confirm ? `Bekræft slet @${username}` : 'Slet'}
    </button>
  )
}
