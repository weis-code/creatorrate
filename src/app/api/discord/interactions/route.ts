import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Discord interactions endpoint is live' })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  console.log('Discord POST received:', body)

  try {
    const interaction = JSON.parse(body)
    console.log('Interaction type:', interaction.type)

    // PING
    if (interaction.type === 1) {
      console.log('Returning PONG')
      return NextResponse.json({ type: 1 })
    }
  } catch (err) {
    console.error('Parse error:', err)
  }

  return NextResponse.json({ type: 1 })
}
