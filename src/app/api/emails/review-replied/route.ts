import { NextResponse } from 'next/server'
import { resend, FROM_EMAIL, creatorReplyEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifySlack } from '@/lib/slack'

export async function POST(req: Request) {
  try {
    const { reviewId, creatorId, replyContent } = await req.json()
    if (!reviewId || !creatorId || !replyContent) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch review + viewer info
    const { data: review } = await supabase
      .from('reviews')
      .select('content, viewer_id, viewer:profiles(username, email)')
      .eq('id', reviewId)
      .single()

    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    // Fetch creator info
    const { data: creator } = await supabase
      .from('creators')
      .select('display_name, slug')
      .eq('id', creatorId)
      .single()

    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    const viewer = review.viewer as any
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.dk'

    // Slack notification
    notifySlack(`💬 *${creator.display_name}* svarede på @${viewer?.username ?? 'anonym'}s anmeldelse\n_"${replyContent.slice(0, 150)}${replyContent.length > 150 ? '…' : ''}"_\n${appUrl}/creators/${creator.slug}`)

    // Email to viewer
    if (viewer?.email && process.env.RESEND_API_KEY) {
      const emailContent = creatorReplyEmail(
        viewer.username ?? 'seer',
        creator.display_name,
        creator.slug,
        review.content,
        replyContent
      )
      await resend.emails.send({
        from: FROM_EMAIL,
        to: viewer.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('review-replied error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
