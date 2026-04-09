import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email mangler' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users.find(u => u.email === email)
  if (!user) {
    // Return success even if user not found to prevent email enumeration
    return NextResponse.json({ success: true })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.creatorrate.io'

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${appUrl}/reset-password` },
  })

  if (linkError || !linkData.properties?.action_link) {
    return NextResponse.json({ error: 'Kunne ikke generere link' }, { status: 500 })
  }

  const resetLink = linkData.properties.action_link

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'CreatorRate <noreply@creatorrate.io>',
      to: email,
      subject: 'Nulstil dit password – CreatorRate',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center">
              <span style="color:white;font-weight:700;font-size:13px">CR</span>
            </div>
            <span style="font-weight:700;font-size:17px;color:#111">CreatorRate</span>
          </div>
          <h2 style="font-size:22px;font-weight:800;color:#111;margin:0 0 8px">Nulstil dit password</h2>
          <p style="color:#555;margin:0 0 24px;line-height:1.6">Klik på knappen herunder for at vælge et nyt password. Linket udløber om 24 timer.</p>
          <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:15px">
            Nulstil password →
          </a>
          <p style="color:#999;font-size:12px;margin-top:28px">Hvis du ikke bad om dette, kan du ignorere denne mail. Dit password ændres ikke, medmindre du klikker på linket.</p>
        </div>
      `,
    }),
  })

  if (!resendRes.ok) {
    const resendError = await resendRes.json().catch(() => ({}))
    console.error('Resend error:', resendRes.status, JSON.stringify(resendError))
    return NextResponse.json({ error: 'Email kunne ikke sendes', detail: resendError }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
