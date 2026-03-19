import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/email'
import { notifySlack } from '@/lib/slack'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.dk'
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get all active creator subscriptions with user_id
  const { data: creators } = await supabase
    .from('creators')
    .select('id, display_name, slug, user_id')
    .not('user_id', 'is', null)

  if (!creators?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const creator of creators) {
    // Get viewer email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', creator.user_id)
      .single()

    if (!profile?.email) continue

    // Get stats for this week
    const { data: newReviews } = await supabase
      .from('reviews')
      .select('rating, content, viewer:profiles(username)')
      .eq('creator_id', creator.id)
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false })

    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('creator_id', creator.id)

    const weeklyCount = newReviews?.length ?? 0
    const avgRating = allReviews?.length
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '–'
    const totalReviews = allReviews?.length ?? 0

    const profileUrl = `${appUrl}/creators/${creator.slug}`
    const dashboardUrl = `${appUrl}/dashboard`

    // Build new reviews section
    const reviewRows = (newReviews ?? []).slice(0, 3).map((r: any) => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)
      return `
        <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid #4f46e5;">
          <div style="color:#f59e0b;font-size:14px;margin-bottom:4px;">${stars}</div>
          <p style="color:#374151;margin:0 0 4px;font-size:13px;font-style:italic;">"${(r.content ?? '').slice(0, 120)}${(r.content ?? '').length > 120 ? '…' : ''}"</p>
          <div style="color:#9ca3af;font-size:12px;">— @${r.viewer?.username ?? 'anonym'}</div>
        </div>`
    }).join('')

    const noReviewsText = weeklyCount === 0
      ? `<p style="color:#6b7280;text-align:center;padding:20px;">Ingen nye anmeldelser denne uge. Del din profil for at få flere!</p>`
      : ''

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">📊</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Din ugentlige rapport</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Hej ${creator.display_name}! Her er din uge på CreatorRate.</p>
    </div>
    <div style="padding:32px;">
      <div style="display:flex;gap:12px;margin-bottom:28px;">
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#166534;">${weeklyCount}</div>
          <div style="color:#4b7c5b;font-size:13px;margin-top:2px;">Nye anmeldelser</div>
        </div>
        <div style="flex:1;background:#ede9fe;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#5b21b6;">${avgRating}★</div>
          <div style="color:#6d28d9;font-size:13px;margin-top:2px;">Gennemsnit</div>
        </div>
        <div style="flex:1;background:#fff7ed;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#92400e;">${totalReviews}</div>
          <div style="color:#b45309;font-size:13px;margin-top:2px;">Anmeldelser i alt</div>
        </div>
      </div>
      ${weeklyCount > 0 ? `<h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 14px;">Nye anmeldelser denne uge</h2>${reviewRows}` : noReviewsText}
      <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;text-align:center;display:block;margin-top:20px;margin-bottom:10px;">Gå til dashboard →</a>
      <a href="${profileUrl}" style="color:#4f46e5;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:500;text-align:center;display:block;border:2px solid #e0e7ff;">Se din profil</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">CreatorRate — Ærlige anmeldelser fra rigtige seere</p>
    </div>
  </div>
</body>
</html>`

    if (process.env.RESEND_API_KEY) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: profile.email,
        subject: `📊 Din ugerapport — ${weeklyCount} nye anmeldelse${weeklyCount !== 1 ? 'r' : ''} denne uge`,
        html,
      })
      if (!error) sent++
    }
  }

  notifySlack(`📊 Ugentlig digest sendt til ${sent} creators`)
  return NextResponse.json({ sent })
}
