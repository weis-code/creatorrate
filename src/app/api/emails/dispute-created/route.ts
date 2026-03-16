import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ success: true, skipped: true })
  }

  const { creatorName, reviewerUsername, rating, content, disputeReason } = await req.json()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'noreply@creatorrate.io',
      to: process.env.ADMIN_EMAIL,
      subject: `🚩 Ny dispute: ${creatorName} → ${reviewerUsername}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f0f1a, #1a1a2e); padding: 24px 32px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">🚩 Ny anmeldelse er blevet disputeret</h1>
          </div>
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Creator</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">${creatorName}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Reviewer</td><td style="padding: 8px 0; font-weight: 600; color: #111827;">@${reviewerUsername}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Rating</td><td style="padding: 8px 0; color: #f59e0b;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</td></tr>
            </table>
            <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">ANMELDELSE</div>
              <p style="color: #374151; margin: 0; font-size: 14px;">${content}</p>
            </div>
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <div style="font-size: 12px; font-weight: 600; color: #c2410c; margin-bottom: 8px;">DISPUTE BEGRUNDELSE</div>
              <p style="color: #c2410c; margin: 0; font-size: 14px;">${disputeReason}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/disputes"
               style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Håndter dispute →
            </a>
          </div>
        </div>
      `,
    }),
  })

  return NextResponse.json({ success: true })
}
