'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface ReviewCardProps {
  review: any
  currentUserId?: string
  creatorUserId?: string
  creatorName?: string
}

export default function ReviewCard({ review, currentUserId, creatorUserId, creatorName }: ReviewCardProps) {
  const t = useTranslations('common')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const isCreator = currentUserId === creatorUserId
  const daysSinceReview = Math.floor((Date.now() - new Date(review.created_at).getTime()) / (1000 * 60 * 60 * 24))

  const handleDispute = async () => {
    if (!disputeReason.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('reviews')
      .update({ is_disputed: true, dispute_reason: disputeReason })
      .eq('id', review.id)

    if (error) setError(t('disputeError'))
    else {
      setShowDisputeForm(false)
      router.refresh()
      // Fire-and-forget: notify admin
      fetch('/api/emails/dispute-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: creatorName ?? 'Unknown',
          reviewerUsername: review.viewer?.username ?? 'anonym',
          rating: review.rating,
          content: review.content,
          disputeReason,
        }),
      }).catch(() => {})
    }
    setLoading(false)
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setLoading(true)
    setError('')

    // Check subscription tier
    const { data: creatorData } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', currentUserId)
      .single()

    if (!creatorData) {
      setError(t('noCreatorProfile'))
      setLoading(false)
      return
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('creator_id', creatorData.id)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      setError(t('subscriptionRequired'))
      setLoading(false)
      return
    }

    if (subscription.tier === 'basic' && daysSinceReview < 30) {
      setError(t('basicRestriction'))
      setLoading(false)
      return
    }

    const { error: replyError } = await supabase
      .from('review_replies')
      .insert({
        review_id: review.id,
        creator_id: creatorData.id,
        content: replyContent,
      })

    if (replyError) setError(t('replyError') + replyError.message)
    else {
      setShowReplyForm(false)
      setReplyContent('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border ${review.is_disputed ? 'border-orange-200 opacity-75' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold text-sm">
              {review.viewer?.username?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/viewers/${review.viewer?.username}`} className="font-medium text-gray-900 text-sm hover:text-indigo-600 transition-colors">
                {review.viewer?.username ?? 'Anonym'}
              </Link>
              {review.platform && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {review.platform === 'YouTube'   && '▶️'}
                  {review.platform === 'TikTok'    && '🎵'}
                  {review.platform === 'Instagram' && '📸'}
                  {review.platform === 'Twitch'    && '🟣'}
                  {review.platform === 'Podcast'   && '🎙️'}
                  {review.platform === 'Andet'     && '🌐'}
                  {' '}{review.platform}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {review.is_disputed && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{t('underReview')}</span>
          )}
        </div>
      </div>

      <p className="text-gray-700 mt-3 text-sm leading-relaxed">{review.content}</p>

      {/* Reply */}
      {review.reply && (
        <div className="mt-4 bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400">
          <div className="text-xs font-semibold text-indigo-700 mb-1">{t('creatorReply')}</div>
          <p className="text-sm text-gray-700">{review.reply.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(review.reply.created_at).toLocaleDateString('da-DK')}
          </p>
        </div>
      )}

      {/* Actions for creator */}
      {isCreator && !review.is_disputed && (
        <div className="mt-4 flex gap-2">
          {!review.reply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('replyToReview')}
            </button>
          )}
          <button
            onClick={() => setShowDisputeForm(!showDisputeForm)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            {t('disputeReview')}
          </button>
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="mt-3 space-y-2">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={t('replyPlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-20"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReply}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? t('sending') : t('sendReply')}
            </button>
            <button onClick={() => { setShowReplyForm(false); setError('') }} className="text-xs text-gray-500 hover:text-gray-700">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Dispute form */}
      {showDisputeForm && (
        <div className="mt-3 space-y-2">
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder={t('disputePlaceholder')}
            className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-20"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDispute}
              disabled={loading}
              className="bg-orange-500 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? t('sending') : t('sendDispute')}
            </button>
            <button onClick={() => setShowDisputeForm(false)} className="text-xs text-gray-500 hover:text-gray-700">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
