import { NextRequest, NextResponse, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ed25519 } from '@noble/curves/ed25519.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a friendly and helpful customer support assistant for CreatorRate.

About CreatorRate:
- CreatorRate is a review platform for content creators — like Trustpilot, but for YouTubers, TikTokers, podcasters, and other online creators.
- Viewers (regular users) can browse creator profiles and leave reviews with a 1–5 star rating. It is completely free for viewers to create an account and leave reviews.
- Creators can create a free profile on the platform so people can find and review them.
- Creators can subscribe to a paid plan (currently $5/month) to unlock the ability to respond to reviews and manage their profile more actively.
- There is a dispute system: if a creator believes a review is fake, misleading, or violates the rules, they can flag it for moderation. Reviews that are found to violate the guidelines can be removed.
- The platform is designed to help audiences make better decisions about which creators to follow, watch, or support — based on real viewer experiences.

Your job:
- Answer questions about how the platform works, pricing, accounts, reviews, disputes, and subscriptions.
- Be concise, friendly, and helpful.
- If you don't know the answer or the question is about something specific to their account (billing issues, account problems, etc.), tell them to send an email to support@creatorrate.io.
- Always respond in the same language the user is writing in. If they write in Danish, reply in Danish. If they write in English, reply in English.
- Keep responses short and to the point.`

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return arr
}

function verifySignature(body: string, signature: string, timestamp: string): boolean {
  try {
    return ed25519.verify(
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + body),
      hexToBytes(process.env.DISCORD_PUBLIC_KEY!)
    )
  } catch {
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSupportCommand(interaction: any) {
  const question = interaction.data?.options?.[0]?.value ?? ''
  const user = interaction.member?.user ?? interaction.user
  const userId = user?.id
  const username = user?.global_name ?? user?.username ?? 'Bruger'
  const webhookUrl = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${interaction.token}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    })

    const answer = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Beklager, noget gik galt. Kontakt support@creatorrate.io'

    const followupRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `<@${userId}> spørger: **${question}**\n\n${answer}`,
      }),
    })

    const message = await followupRes.json()

    if (message.id && interaction.channel_id) {
      await fetch(
        `https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${message.id}/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify({ name: `🎫 Support: ${username}`, auto_archive_duration: 1440 }),
        }
      )
    }
  } catch (err) {
    console.error('Discord support error:', err)
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `<@${userId}> Beklager, noget gik galt. Send en mail til support@creatorrate.io`,
      }),
    }).catch(() => {})
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-signature-ed25519') ?? ''
  const timestamp = req.headers.get('x-signature-timestamp') ?? ''

  if (!verifySignature(body, signature, timestamp)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interaction: any = JSON.parse(body)

  // PING
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 })
  }

  // Slash command: /support
  if (interaction.type === 2 && interaction.data?.name === 'support') {
    after(async () => { await handleSupportCommand(interaction) })
    return NextResponse.json({ type: 5 })
  }

  return NextResponse.json({ error: 'Unknown interaction' }, { status: 400 })
}
