export type UserRole = 'viewer' | 'creator'

export type SubscriptionTier = 'basic' | 'pro' | null

export interface Profile {
  id: string
  email: string
  role: UserRole
  username: string
  avatar_url?: string
  created_at: string
}

export interface Creator {
  id: string
  user_id: string
  display_name: string
  bio?: string
  category?: string
  avatar_url?: string
  website_url?: string
  youtube_url?: string
  instagram_url?: string
  tiktok_url?: string
  average_rating: number
  review_count: number
  created_at: string
  slug: string
}

export interface Review {
  id: string
  creator_id: string
  viewer_id: string
  rating: number
  content: string
  is_disputed: boolean
  dispute_reason?: string
  created_at: string
  viewer?: Profile
  reply?: ReviewReply
}

export interface ReviewReply {
  id: string
  review_id: string
  creator_id: string
  content: string
  created_at: string
}

export interface Subscription {
  id: string
  creator_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  tier: 'basic' | 'pro'
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string
  created_at: string
}
