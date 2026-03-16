import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Find the user by email
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    // Don't reveal if user exists or not — just say it's sent
    return NextResponse.json({ success: true })
  }

  if (user.email_confirmed_at) {
    return NextResponse.json({ error: 'already_confirmed' }, { status: 400 })
  }

  // Generate a new confirmation link
  const { data: linkData, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/setup`,
    },
  })

  if (error || !linkData?.properties?.action_link) {
    console.error('Failed to generate link:', error)
    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'noreply@creatorrate.io',
      to: email,
      subject: 'Bekræft din CreatorRate konto',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CreatorRate</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; margin-top: 0;">Bekræft din konto 👋</h2>
            <p style="color: #6b7280;">Din betaling er gennemført. Klik på knappen herunder for at bekræfte din konto og komme i gang.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${linkData.properties.action_link}"
                 style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Bekræft konto og kom i gang →
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Linket udløber om 24 timer. Tjek spam-mappen hvis du ikke kan finde mailen.</p>
          </div>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
