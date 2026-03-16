import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const { to, username, creatorName, creatorSlug, approved, reason } = await req.json()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorrate.io'

  const approvedHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">CreatorRate</div>
        <div style="font-size:22px;font-weight:800;color:#fff">Din profil er godkendt! 🎉</div>
      </div>
      <div style="padding:28px 32px">
        <p style="color:#374151;font-size:15px;margin:0 0 16px">
          Hej <strong>@${username}</strong> 👋
        </p>
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          Vi har verificeret dit ejerskab af <strong>${creatorName}</strong> og godkendt din overtagelse. Du kan nu logge ind og administrere din profil.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px">
          <div style="color:#15803d;font-weight:700;margin-bottom:4px">✓ Verificeret og godkendt</div>
          <div style="color:#16a34a;font-size:14px">Din verifikationskode kan nu fjernes fra din bio.</div>
        </div>

        <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
          Gå til dit dashboard →
        </a>
      </div>
      <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6">
        <p style="color:#9ca3af;font-size:12px;margin:0">CreatorRate · ${appUrl}</p>
      </div>
    </div>
  `

  const rejectedHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#1f2937;padding:28px 32px">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">CreatorRate</div>
        <div style="font-size:22px;font-weight:800;color:#fff">Verifikation ikke godkendt</div>
      </div>
      <div style="padding:28px 32px">
        <p style="color:#374151;font-size:15px;margin:0 0 16px">
          Hej <strong>@${username}</strong>,
        </p>
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          Vi kunne desværre ikke verificere dit ejerskab af <strong>${creatorName}</strong> denne gang.
        </p>

        ${reason ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:24px">
          <div style="color:#b91c1c;font-weight:700;margin-bottom:4px">Årsag</div>
          <div style="color:#dc2626;font-size:14px">${reason}</div>
        </div>
        ` : ''}

        <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
          Du er velkommen til at prøve igen. Sørg for at verifikationskoden er tydeligt placeret i bio'en på mindst én af dine platforme.
        </p>

        <a href="${appUrl}/creators/${creatorSlug}/claim" style="display:inline-block;background:#1f2937;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px">
          Prøv igen →
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
      to,
      subject: approved
        ? `Din profil ${creatorName} er godkendt! 🎉`
        : `Din overtagelsesanmodning for ${creatorName}`,
      html: approved ? approvedHtml : rejectedHtml,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error (claim-resolved):', err)
    return NextResponse.json({ success: false, error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
