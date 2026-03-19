import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@creatorrate.dk'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://creatorrate.dk'

export function newReviewEmail(
  creatorName: string,
  reviewerUsername: string,
  rating: number,
  content: string,
  creatorSlug: string
) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const dashboardUrl = `${APP_URL}/dashboard`
  const profileUrl = `${APP_URL}/creators/${creatorSlug}`

  return {
    subject: `New ${rating}-star review from @${reviewerUsername}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">⭐</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">New review on CreatorRate</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${creatorName}</strong>,</p>
      <p style="color:#374151;margin:0 0 20px;">You received a new review from <strong>@${reviewerUsername}</strong>:</p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border-left:4px solid #4f46e5;margin-bottom:24px;">
        <div style="color:#f59e0b;font-size:20px;margin-bottom:8px;">${stars}</div>
        <p style="color:#374151;margin:0;font-style:italic;">"${content}"</p>
      </div>
      <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;text-align:center;display:block;margin-bottom:12px;">View on dashboard</a>
      <a href="${profileUrl}" style="color:#4f46e5;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:500;text-align:center;display:block;border:2px solid #e0e7ff;">View your profile</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">CreatorRate — Honest reviews from real viewers</p>
    </div>
  </div>
</body>
</html>`,
  }
}

export function welcomeCreatorEmail(creatorName: string, slug: string) {
  const profileUrl = `${APP_URL}/creators/${slug}`
  const dashboardUrl = `${APP_URL}/dashboard`

  return {
    subject: `Welcome to CreatorRate, ${creatorName}! 🎉`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🎉</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Your profile is live!</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>${creatorName}</strong>, welcome to CreatorRate!</p>
      <p style="color:#374151;margin:0 0 24px;">Your creator profile is now live. Share it with your audience to start collecting reviews.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-weight:600;color:#166534;margin-bottom:12px;">Next steps:</div>
        <ul style="color:#374151;margin:0;padding-left:20px;line-height:2;">
          <li>Share your profile link with your audience</li>
          <li>Ask viewers to leave honest reviews</li>
          <li>Consider a subscription to reply to reviews</li>
        </ul>
      </div>
      <a href="${profileUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;text-align:center;display:block;margin-bottom:12px;">View your profile →</a>
      <a href="${dashboardUrl}" style="color:#4f46e5;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:500;text-align:center;display:block;border:2px solid #e0e7ff;">Go to dashboard</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">CreatorRate — Honest reviews from real viewers</p>
    </div>
  </div>
</body>
</html>`,
  }
}

export function creatorReplyEmail(
  viewerUsername: string,
  creatorName: string,
  creatorSlug: string,
  originalContent: string,
  replyContent: string
) {
  const profileUrl = `${APP_URL}/creators/${creatorSlug}`
  const stars = '💬'
  return {
    subject: `${creatorName} har svaret på din anmeldelse`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">💬</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">${creatorName} har svaret!</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hej <strong>@${viewerUsername}</strong>!</p>
      <p style="color:#374151;margin:0 0 20px;"><strong>${creatorName}</strong> har svaret på din anmeldelse:</p>
      <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:12px;border-left:4px solid #e5e7eb;">
        <div style="font-size:12px;color:#9ca3af;margin-bottom:6px;">Din anmeldelse</div>
        <p style="color:#6b7280;margin:0;font-style:italic;">"${originalContent.slice(0, 200)}${originalContent.length > 200 ? '…' : ''}"</p>
      </div>
      <div style="background:#ede9fe;border-radius:12px;padding:16px;margin-bottom:24px;border-left:4px solid #4f46e5;">
        <div style="font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:6px;">${creatorName}s svar</div>
        <p style="color:#374151;margin:0;">"${replyContent}"</p>
      </div>
      <a href="${profileUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;text-align:center;display:block;">Se anmeldelsen →</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">CreatorRate — Ærlige anmeldelser fra rigtige seere</p>
    </div>
  </div>
</body>
</html>`,
  }
}

export function welcomeViewerEmail(username: string) {
  const exploreUrl = `${APP_URL}/creators`

  return {
    subject: `Welcome to CreatorRate, @${username}!`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">👋</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Welcome to CreatorRate!</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi <strong>@${username}</strong>!</p>
      <p style="color:#374151;margin:0 0 24px;">You've joined CreatorRate — the place to find and review your favourite creators. Your honest opinion helps others discover quality content.</p>
      <a href="${exploreUrl}" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;text-align:center;display:block;">Explore creators →</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">CreatorRate — Honest reviews from real viewers</p>
    </div>
  </div>
</body>
</html>`,
  }
}
