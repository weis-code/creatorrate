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

  const navItems = [
    { href: '/admin', label: 'Overblik', icon: '📊' },
    { href: '/admin/users', label: 'Brugere', icon: '👥' },
    { href: '/admin/disputes', label: 'Disputes', icon: '🚩' },
    { href: '/admin/subscriptions', label: 'Abonnementer', icon: '💳' },
  ]

  return (
    <div className="min-h-screen bg-[#f8f8fc] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0f0f1a] flex-shrink-0 flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-[10px]">CR</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm">CreatorRate</span>
              <div className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all text-sm font-medium group"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/60 transition-all text-xs font-medium"
          >
            <span>←</span>
            Tilbage til sitet
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-56">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">Admin Panel</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-gray-500 font-medium">{adminEmail}</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
