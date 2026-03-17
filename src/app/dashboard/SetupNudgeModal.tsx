'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SetupNudgeModal() {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />

        <div className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-2xl">🎬</span>
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Én ting mangler!</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Din profil er klar — men seerne kan endnu ikke finde dig.
              Tilføj bio, kategori og platformlinks for at gå live.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-2 mb-6">
            {[
              { icon: '✍️', text: 'Tilføj en kort bio om dig selv' },
              { icon: '🔗', text: 'Link dine platforme (YouTube, Instagram, TikTok)' },
              { icon: '🚀', text: 'Gå live og modtag anmeldelser' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="text-xs text-gray-700 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <Link
            href="/dashboard/setup"
            className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-lg shadow-indigo-200 mb-2"
          >
            Fuldfør profil nu →
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            Senere
          </button>
        </div>
      </div>
    </div>
  )
}
