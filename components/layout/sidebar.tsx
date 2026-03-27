'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  GitCompare,
  Kanban,
  Activity,
  Wallet,
  Users,
  BarChart3,
  FileText,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Capital overview' },
  { href: '/deal-analyzer', label: 'Deal Analyzer', icon: TrendingUp, description: 'Analyze & project' },
  { href: '/deals', label: 'Deal Comparator', icon: GitCompare, description: 'Rank & compare' },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban, description: 'CRM stages' },
  { href: '/performance', label: 'Performance', icon: Activity, description: 'Projected vs actual' },
  { href: '/capital', label: 'Capital', icon: Wallet, description: 'Allocation engine' },
  { href: '/investors', label: 'Investors', icon: Users, description: 'Multi-investor' },
  { href: '/fund', label: 'Fund', icon: BarChart3, description: 'Fund dashboard' },
  { href: '/reports', label: 'Reports', icon: FileText, description: 'Automated reports' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Unchained OS</p>
          <p className="text-xs text-zinc-500">Operating System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(({ href, label, icon: Icon, description }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 group transition-colors',
                active
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-violet-400' : '')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{label}</p>
                <p className={cn('text-xs truncate', active ? 'text-violet-400/70' : 'text-zinc-600')}>{description}</p>
              </div>
              {active && <ChevronRight className="w-3 h-3 text-violet-400 shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">v1.0 · Private Equity OS</p>
      </div>
    </aside>
  )
}
