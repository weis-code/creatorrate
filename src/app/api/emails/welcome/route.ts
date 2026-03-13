import { NextResponse } from 'next/server'
import { resend, FROM_EMAIL, welcomeCreatorEmail, welcomeViewerEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email, username, role, creatorName, slug } = await req.json()

    if (!email || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Don't send emails if RESEND_API_KEY is not configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const emailContent = role === 'creator' && creatorName && slug
      ? welcomeCreatorEmail(creatorName, slug)
      : welcomeViewerEmail(username)

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (error) {
      console.error('Welcome email error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Welcome email route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
