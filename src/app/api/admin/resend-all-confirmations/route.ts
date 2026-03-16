import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')
  if (adminAuth?.value !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const unconfirmed = users.filter(u => !u.email_confirmed_at && u.email)
  const results: { email: string; status: string }[] = []

  for (const user of unconfirmed) {
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/setup`,
        },
      })

      if (linkError || !linkData?.properties?.action_link) {
        results.push({ email: user.email!, status: `fejl: ${linkError?.message}` })
        continue
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@creatorrate.io',
          to: user.email!,
          subject: 'Bekræft din CreatorRate konto',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">CreatorRate</h1>
              </div>
              <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
                <h2 style="color: #111827; margin-top: 0;">Bekræft din konto 👋</h2>
                <p style="color: #6b7280;">Du har betalt for et CreatorRate-abonnement. Klik herunder for at bekræfte din konto og komme i gang.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${linkData.properties.action_link}"
                     style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Bekræft konto og kom i gang →
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">Linket udløber om 24 timer.</p>
              </div>
            </div>
          `,
        }),
      })

      if (res.ok) {
        results.push({ email: user.email!, status: 'sendt' })
      } else {
        const err = await res.text()
        results.push({ email: user.email!, status: `resend fejl: ${err}` })
      }
    } catch (e: any) {
      results.push({ email: user.email!, status: `undtagelse: ${e.message}` })
    }
  }

  return NextResponse.json({ total: unconfirmed.length, results })
}
