'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard',            icon: '🏠', label: 'Início' },
  { href: '/dashboard/medications', icon: '💊', label: 'Remédios' },
  { href: '/dashboard/history',    icon: '📅', label: 'Histórico' },
  { href: '/dashboard/caregiver',  icon: '👥', label: 'Cuidador' },
  { href: '/dashboard/settings',   icon: '⚙️', label: 'Config' },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-2 py-2 z-50 shadow-lg">
      <div className="max-w-2xl mx-auto flex">
        {navItems.map(item => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link flex-1 ${isActive ? 'active' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
