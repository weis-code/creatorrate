// Kør én gang for at registrere /support kommandoen hos Discord:
// node scripts/register-discord-commands.mjs

import { readFileSync } from 'fs'

// Indlæs .env.local automatisk
try {
  const env = readFileSync('.env.local', 'utf-8')
  for (const line of env.split('\n')) {
    const eqIndex = line.indexOf('=')
    if (eqIndex > 0) {
      const key = line.slice(0, eqIndex).trim()
      const value = line.slice(eqIndex + 1).trim()
      if (key && !key.startsWith('#')) process.env[key] = value
    }
  }
} catch {
  // .env.local ikke fundet — bruger eksisterende env vars
}

const APP_ID = process.env.DISCORD_APP_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

if (!APP_ID || !BOT_TOKEN) {
  console.error('Mangler DISCORD_APP_ID eller DISCORD_BOT_TOKEN i .env.local')
  process.exit(1)
}

const commands = [
  {
    name: 'support',
    description: 'Stil et spørgsmål til CreatorRate support',
    options: [
      {
        name: 'spørgsmål',
        description: 'Hvad har du brug for hjælp til?',
        type: 3, // STRING
        required: true,
      },
    ],
  },
]

const res = await fetch(
  `https://discord.com/api/v10/applications/${APP_ID}/commands`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  }
)

const data = await res.json()

if (res.ok) {
  console.log('✅ Slash command registreret:', data.map((c) => `/${c.name}`).join(', '))
} else {
  console.error('❌ Fejl:', JSON.stringify(data, null, 2))
}
