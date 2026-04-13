import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { FROM_EMAIL } from '@/lib/email'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  if (!adminAuth || adminAuth !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject, html, audience } = await req.json()
  if (!subject || !html || !audience) {
    return NextResponse.json({ error: 'Mangler subject, html eller audience' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch recipients based on audience
  let emails: string[] = []

  if (audience === 'all' || audience === 'viewers') {
    const { data: viewers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'viewer')

    if (viewers?.length) {
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const viewerIds = new Set(viewers.map(v => v.id))
      const viewerEmails = authUsers?.users
        .filter(u => viewerIds.has(u.id) && u.email)
        .map(u => u.email!) ?? []
      emails.push(...viewerEmails)
    }
  }

  if (audience === 'all' || audience === 'creators') {
    const { data: creators } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'creator')

    if (creators?.length) {
      const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const creatorIds = new Set(creators.map(c => c.id))
      const creatorEmails = authUsers?.users
        .filter(u => creatorIds.has(u.id) && u.email)
        .map(u => u.email!) ?? []
      emails.push(...creatorEmails)
    }
  }

  // Deduplicate
  emails = [...new Set(emails)]

  if (emails.length === 0) {
    return NextResponse.json({ error: 'Ingen modtagere fundet' }, { status: 400 })
  }

  // Send in batches of 50 (Resend batch limit)
  const batchSize = 50
  let sent = 0
  let failed = 0

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const payload = batch.map(to => ({
      from: `CreatorRate <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    }))

    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      sent += batch.length
    } else {
      const err = await res.json().catch(() => ({}))
      console.error('Batch send error:', err)
      failed += batch.length
    }
  }

  return NextResponse.json({ success: true, sent, failed, total: emails.length })
}
