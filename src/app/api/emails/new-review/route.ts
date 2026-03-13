import { NextResponse } from 'next/server'
import { resend, FROM_EMAIL, newReviewEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { creatorId, reviewerUsername, rating, content } = await req.json()

    if (!creatorId || !reviewerUsername || !rating || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Don't send emails if RESEND_API_KEY is not configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const supabase = await createClient()

    const { data: creator } = await supabase
      .from('creators')
      .select('display_name, slug, user_id')
      .eq('id', creatorId)
      .single()

    if (!creator || !creator.user_id) {
      return NextResponse.json({ error: 'Creator not found or unclaimed' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', creator.user_id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'Creator email not found' }, { status: 404 })
    }

    const emailContent = newReviewEmail(
      creator.display_name,
      reviewerUsername,
      rating,
      content,
      creator.slug
    )

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (error) {
      console.error('New review email error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('New review email route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
