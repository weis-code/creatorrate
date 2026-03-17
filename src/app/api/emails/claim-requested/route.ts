import { NextResponse } from 'next/server'
import { notifySlack } from '@/lib/slack'

export async function POST(req: Request) {
  const {
    creatorName,
    creatorSlug,
    claimantUsername,
    verificationCode,
    youtubeUrl,
    instagramUrl,
    tiktokUrl,
  } = await req.json()

  // Slack notification (always)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorrate.io'
  const links = [youtubeUrl, instagramUrl, tiktokUrl].filter(Boolean).join(' | ')
  notifySlack(`🔑 *Ny claim-anmodning*\n@${claimantUsername} vil overtage *${creatorName}*\nKode: \`${verificationCode}\`${links ? `\nLinks: ${links}` : ''}\n${appUrl}/admin/claims`)

  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const platformLinks = [
    youtubeUrl && `<a href="${youtubeUrl}" style="color:#6366f1">YouTube →</a>`,
    instagramUrl && `<a href="${instagramUrl}" style="color:#ec4899">Instagram →</a>`,
    tiktokUrl && `<a href="${tiktokUrl}" style="color:#111">TikTok →</a>`,
  ].filter(Boolean).join('&nbsp;&nbsp;')

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">CreatorRate Admin</div>
        <div style="font-size:22px;font-weight:800;color:#fff">Ny overtagelsesanmodning 🔑</div>
      </div>
      <div style="padding:28px 32px">
        <p style="color:#374151;font-size:15px;margin:0 0 20px">
          <strong>@${claimantUsername}</strong> ønsker at overtage profilen <strong>${creatorName}</strong>.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">Platform-links</div>
          <div style="font-size:14px">${platformLinks || '<span style="color:#9ca3af">Ingen links</span>'}</div>
        </div>

        <div style="background:#0f172a;border-radius:12px;padding:16px 20px;margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Verifikationskode der skal stå i bio</div>
          <code style="font-family:monospace;font-size:18px;font-weight:700;color:#818cf8">${verificationCode}</code>
        </div>

        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
          Klik ind på platformen, tjek at koden er i bio'en, og godkend eller afvis herunder.
        </p>

        <a href="${appUrl}/admin/claims" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
          Se i admin-panelet →
        </a>
      </div>
      <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:12px;margin:0">CreatorRate · ${appUrl}</p>
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'noreply@creatorrate.io',
      to: process.env.ADMIN_EMAIL,
      subject: `Ny overtagelsesanmodning: ${creatorName} af @${claimantUsername}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error (claim-requested):', err)
    return NextResponse.json({ success: false, error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
