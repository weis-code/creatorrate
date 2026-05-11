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
- If you don't know the answer or the question is about something specific to their account (billing issues, account problems, etc.), tell them to join our Discord server for live support: https://discord.gg/RpZDx2wH2B
- Always respond in the same language the user is writing in. If they write in Danish, reply in Danish. If they write in English, reply in English.
- Keep responses short and to the point.`

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function botHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
  }
}

// ── Post support-knap i kanalen (kør /setup-support én gang) ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function postSupportButton(interaction: any) {
  const webhookUrl = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${interaction.token}`

  await fetch(`https://discord.com/api/v10/channels/${interaction.channel_id}/messages`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify({
      content: '**Har du brug for hjælp?** 👇\nKlik på knappen nedenfor for at åbne en privat support-sag med en admin.',
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 1,
          label: '🎫 Åbn support',
          custom_id: 'open_support',
        }],
      }],
    }),
  })

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '✅ Support-knap er nu sat op i kanalen!', flags: 64 }),
  })
}

// ── Opret privat kanal når bruger klikker på knappen ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOpenTicket(interaction: any) {
  const user = interaction.member?.user ?? interaction.user
  const userId = user?.id
  const username = (user?.global_name ?? user?.username ?? 'bruger')
    .toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)
  const guildId = interaction.guild_id
  const webhookUrl = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APP_ID}/${interaction.token}`

  try {
    // 1. Opret privat kanal under Viewer Zone
    const channelRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        method: 'POST',
        headers: botHeaders(),
        body: JSON.stringify({
          name: `ticket-${username}`,
          type: 0, // text channel
          parent_id: process.env.VIEWER_ZONE_CATEGORY_ID,
          permission_overwrites: [
            { id: guildId, type: 0, deny: '1024' },                        // @everyone: ingen adgang
            { id: userId, type: 1, allow: '68608' },                       // brugeren: se + skrive
            { id: process.env.ADMIN_ROLE_ID!, type: 0, allow: '68624' },   // admin: se + skrive + slet
          ],
        }),
      }
    )

    const channel = await channelRes.json()
    if (!channel.id) throw new Error('Kanal kunne ikke oprettes')

    // 2. Velkomstbesked i den nye kanal
    await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({
        content: `Hej <@${userId}>! 👋\n\nDu er nu i din private support-kanal. Hvad kan jeg hjælpe dig med?\n\nEn admin kan også se denne kanal og svare dig direkte.`,
      }),
    })

    // 3. Ephemeral besked til brugeren med link
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `✅ Din private support-kanal er klar: <#${channel.id}>`,
        flags: 64,
      }),
    })
  } catch (err) {
    console.error('Ticket error:', err)
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Beklager, noget gik galt. Prøv igen.', flags: 64 }),
    }).catch(() => {})
  }
}

// ── /support slash command ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSupportCommand(interaction: any) {
  const question = interaction.data?.options?.[0]?.value ?? ''
  const user = interaction.member?.user ?? interaction.user
  const userId = user?.id
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
      : 'Beklager, noget gik galt.'

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `<@${userId}>\n\n${answer}`, flags: 64 }),
    })
  } catch (err) {
    console.error('Support command error:', err)
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Beklager, noget gik galt. Prøv igen.', flags: 64 }),
    }).catch(() => {})
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
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

  // Knap: åbn support-ticket
  if (interaction.type === 3 && interaction.data?.custom_id === 'open_support') {
    after(async () => { await handleOpenTicket(interaction) })
    return NextResponse.json({ type: 5, data: { flags: 64 } })
  }

  // Slash: /setup-support (kør én gang i #request-viewer-support)
  if (interaction.type === 2 && interaction.data?.name === 'setup-support') {
    after(async () => { await postSupportButton(interaction) })
    return NextResponse.json({ type: 5, data: { flags: 64 } })
  }

  // Slash: /support
  if (interaction.type === 2 && interaction.data?.name === 'support') {
    after(async () => { await handleSupportCommand(interaction) })
    return NextResponse.json({ type: 5, data: { flags: 64 } })
  }

  return NextResponse.json({ error: 'Unknown interaction' }, { status: 400 })
}
