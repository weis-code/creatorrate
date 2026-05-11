import { NextRequest, NextResponse, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const PING = 1
const APPLICATION_COMMAND = 2
const PONG = 1
const DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5

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

// ── Ed25519 signature verification using Web Crypto ──────────────────────────
function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToUint8Array(process.env.DISCORD_PUBLIC_KEY!),
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      hexToUint8Array(signature),
      new TextEncoder().encode(timestamp + body)
    )
  } catch {
    return false
  }
}

// ── Handle /support command ───────────────────────────────────────────────────
async function handleSupportCommand(interaction: {
  data: { options?: { value: string }[] }
  member?: { user?: { id?: string; username?: string; global_name?: string } }
  user?: { id?: string; username?: string; global_name?: string }
  channel_id?: string
  token: string
}) {
  const question = interaction.data.options?.[0]?.value ?? ''
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

    const answer =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Beklager, noget gik galt. Kontakt support@creatorrate.io'

    // Send the answer as a followup message
    const followupRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `<@${userId}> spørger: **${question}**\n\n${answer}`,
      }),
    })

    const message = await followupRes.json()

    // Create a thread from the message so the conversation stays tidy
    if (message.id && interaction.channel_id) {
      await fetch(
        `https://discord.com/api/v10/channels/${interaction.channel_id}/messages/${message.id}/threads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify({
            name: `🎫 Support: ${username}`,
            auto_archive_duration: 1440, // arkiveres efter 24 timer uden aktivitet
          }),
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

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-signature-ed25519') ?? ''
  const timestamp = req.headers.get('x-signature-timestamp') ?? ''

  const isValid = await verifyDiscordSignature(body, signature, timestamp)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const interaction = JSON.parse(body)

  // Discord ping — krævet for at validere endpoint URL
  if (interaction.type === PING) {
    return NextResponse.json({ type: PONG })
  }

  // Slash command: /support
  if (interaction.type === APPLICATION_COMMAND && interaction.data.name === 'support') {
    // Kør AI-kaldet efter vi har sendt "tænker..."-svaret til Discord
    after(async () => {
      await handleSupportCommand(interaction)
    })

    // Svar inden for 3 sekunder med "tænker..." indikator
    return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE })
  }

  return NextResponse.json({ error: 'Unknown interaction' }, { status: 400 })
}
