import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export const PLANS = {
  BASIC: {
    name: 'Basic',
    price: 99,
    priceId: process.env.STRIPE_PRICE_ID_BASIC!,
    description: 'Reply to reviews older than 1 month',
    features: ['Reply to older reviews (>1 month)', 'Creator profile', 'Dispute reviews'],
  },
  PRO: {
    name: 'Pro',
    price: 149,
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    description: 'Reply to all reviews instantly',
    features: ['Reply to all reviews instantly', 'Creator profile', 'Dispute reviews', 'Priority support'],
  },
}
