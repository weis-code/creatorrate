import { NextRequest, NextResponse, after } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import nacl from 'tweetnacl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

function verifyDiscordSignature(body: string, signature: string, timestamp: string): boolean {
  try {
    const sig = Buffer.from(signature, 'hex')
    const msg = Buffer.from(timestamp + body)
    const key = Buffer.from(process.env.DISCORD_PUBLIC_KEY!, 'hex')
    return nacl.sign.detached.verify(msg, sig, key)
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}

// ── GET: bruges til at bekræfte at endpoint er tilgængeligt ──────────────────
export function GET() {
  return NextResponse.json({ ok: true, message: 'Discord interactions endpoint is live' })
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text()
  console.log('POST body:', body)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let interaction: any
  try {
    interaction = JSON.parse(body)
  } catch {
    console.error('Invalid JSON body')
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  console.log('Interaction type:', interaction.type)

  // MIDLERTIDIGT: verifikation sprunget over for debugging
  // Discord ping
  if (interaction.type === PING) {
    console.log('Responding to PING')
    return NextResponse.json({ type: PONG })
  }

  // Slash command: /support
  if (interaction.type === APPLICATION_COMMAND && interaction.data?.name === 'support') {
    after(async () => {
      await handleSupportCommand(interaction)
    })
    return NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE })
  }

  return NextResponse.json({ error: 'Unknown interaction' }, { status: 400 })
}
