import { NextResponse } from 'next/server'
import { resend, FROM_EMAIL, newReviewEmail } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'
import { notifySlack } from '@/lib/slack'

export async function POST(req: Request) {
  try {
    const { creatorId, reviewerUsername, rating, content } = await req.json()

    if (!creatorId || !reviewerUsername || !rating || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: creator } = await supabase
      .from('creators')
      .select('display_name, slug, user_id')
      .eq('id', creatorId)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Slack notification (always, regardless of email config)
    const stars = '⭐'.repeat(rating)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorrate.io'
    notifySlack(`${stars} *Ny anmeldelse af ${creator.display_name}*\n@${reviewerUsername} gav *${rating}/5*\n_"${content.slice(0, 200)}${content.length > 200 ? '…' : ''}"_\n${appUrl}/creators/${creator.slug}`)

    // Send email to creator if claimed and email configured
    if (creator.user_id && process.env.RESEND_API_KEY) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', creator.user_id)
        .single()

      if (profile?.email) {
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
        if (error) console.error('New review email error:', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('New review email route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
