import { NextResponse } from 'next/server'

// This endpoint is deprecated. Use /api/creators/claim/start instead.
// Kept to avoid 404s from any cached clients.
export async function POST() {
  return NextResponse.json(
    { error: 'Brug /api/creators/claim/start for at starte en overtagelsesanmodning' },
    { status: 410 }
  )
}
