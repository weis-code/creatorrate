'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number
  interactive?: boolean
  onRate?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, interactive = false, onRate, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (interactive ? hovered || rating : rating) >= star
        return (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${filled ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer transition-colors' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onRate?.(star)}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
    </div>
  )
}
