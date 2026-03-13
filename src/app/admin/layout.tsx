import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()

  if (!adminAuth || adminAuth !== adminEmail) {
    redirect('/admin-login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gray-900 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">⚙️ Admin</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">Overview</Link>
              <Link href="/admin/disputes" className="text-gray-300 hover:text-white transition-colors">Disputes</Link>
              <Link href="/admin/subscriptions" className="text-gray-300 hover:text-white transition-colors">Abonnementer</Link>
              <Link href="/admin/users" className="text-gray-300 hover:text-white transition-colors">Users</Link>
            </nav>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">← Back to site</Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
