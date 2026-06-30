import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export const PLANS = {
  PRO: {
    name: 'Pro',
    price: 5,
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    description: 'Reply to all reviews instantly',
    features: ['Reply to all reviews instantly', 'Creator profile', 'Dispute reviews', 'Priority support'],
  },
}
