import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()

  if (!adminAuth || adminAuth !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action } = await req.json() // 'approve' | 'reject'

  const supabase = getSupabaseAdmin()

  // Fetch review with creator + viewer info before updating
  const { data: review } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      content,
      dispute_reason,
      creator:creators(display_name, slug, user_id),
      viewer:profiles!reviews_viewer_id_fkey(username)
    `)
    .eq('id', id)
    .single()

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  // Update DB
  if (action === 'approve') {
    // Dispute approved: delete the review permanently
    await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
  } else {
    // Dispute rejected: restore review (un-dispute it)
    await supabase
      .from('reviews')
      .update({ is_disputed: false, dispute_reason: null })
      .eq('id', id)
  }

  // Send email to creator (fire-and-forget in background)
  const creator = review.creator as any
  if (creator?.user_id && process.env.RESEND_API_KEY) {
    try {
      // Get creator's email from auth.users
      const { data: { user } } = await supabase.auth.admin.getUserById(creator.user_id)
      if (user?.email) {
        const isApproved = action === 'approve'
        const subject = isApproved
          ? `✅ Din dispute er godkendt`
          : `❌ Din dispute er afvist`

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.FROM_EMAIL || 'noreply@creatorrate.io',
            to: user.email,
            subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0f0f1a, #1a1a2e); padding: 24px 32px; border-radius: 16px 16px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 18px;">${isApproved ? '✅' : '❌'} Opdatering på din dispute</h1>
                </div>
                <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
                  <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
                    Hej <strong>${creator.display_name}</strong>,
                  </p>
                  ${isApproved ? `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                      <p style="color: #166534; margin: 0; font-size: 14px;">
                        <strong>Din dispute er godkendt.</strong> Anmeldelsen er blevet fjernet fra din profil.
                      </p>
                    </div>
                  ` : `
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                      <p style="color: #991b1b; margin: 0; font-size: 14px;">
                        <strong>Din dispute er afvist.</strong> Anmeldelsen forbliver synlig på din profil, da vi ikke fandt grundlag for at fjerne den.
                      </p>
                    </div>
                  `}
                  <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">ANMELDELSE DER BLEV DISPUTERET</div>
                    <p style="color: #374151; margin: 0 0 8px; font-size: 14px;">${(review.viewer as any)?.username ? `@${(review.viewer as any).username}` : 'Anonym'} — ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
                    <p style="color: #6b7280; margin: 0; font-size: 13px; font-style: italic;">"${review.content}"</p>
                  </div>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/creators/${creator.slug}"
                     style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Se din profil →
                  </a>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                    Har du spørgsmål? Kontakt os på <a href="mailto:${process.env.ADMIN_EMAIL}" style="color: #4f46e5;">${process.env.ADMIN_EMAIL}</a>
                  </p>
                </div>
              </div>
            `,
          }),
        })
      }
    } catch {
      // Email failure should not break the response
    }
  }

  return NextResponse.json({ success: true })
}
