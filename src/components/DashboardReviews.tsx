'use client'

import ReviewCard from '@/components/ReviewCard'

interface Props {
  reviews: any[]
  creatorUserId: string
  creatorName: string
  currentUserId: string
}

export default function DashboardReviews({ reviews, creatorUserId, creatorName, currentUserId }: Props) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          creatorUserId={creatorUserId}
          creatorName={creatorName}
        />
      ))}
    </div>
  )
}
