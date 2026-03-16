import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  if (adminAuth?.value !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email mangler' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const user = users.users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: 'Ingen bruger fundet med den email' }, { status: 404 })

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
  })
  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })

  const resetLink = linkData.properties?.action_link
  if (!resetLink) return NextResponse.json({ error: 'Kunne ikke generere reset-link' }, { status: 500 })

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
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:8px">Nulstil dit password</h2>
          <p style="color:#555;margin-bottom:24px">Klik på knappen herunder for at vælge et nyt password til din CreatorRate-konto.</p>
          <a href="${resetLink}" style="display:inline-block;background:#4f46e5;color:white;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
            Nulstil password →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">Linket udløber om 24 timer. Hvis du ikke bad om dette, kan du ignorere denne mail.</p>
        </div>
      `,
    }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.json()
    return NextResponse.json({ error: `Email fejlede: ${err.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, email })
}
