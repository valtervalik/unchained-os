'use client'

import { Bell, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function Header({ title }: { title: string }) {
  const alerts = useStore(s => s.alerts)
  const dismissAlert = useStore(s => s.dismissAlert)
  const active = alerts.filter(a => !a.dismissed)

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors outline-none">
            <Bell className="w-5 h-5" />
            {active.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {active.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800">
            <div className="px-3 py-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              Alerts {active.length > 0 && <Badge variant="destructive" className="ml-2 text-xs">{active.length}</Badge>}
            </div>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {active.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-zinc-500">No active alerts</div>
            )}
            {active.slice(0, 8).map(alert => (
              <DropdownMenuItem key={alert.id} className="flex-col items-start gap-1 p-3 focus:bg-zinc-800">
                <div className="flex w-full items-start justify-between">
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400',
                  )}>
                    {alert.dealName}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); dismissAlert(alert.id) }}
                    className="text-zinc-600 hover:text-zinc-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-zinc-300">{alert.message}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">U</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-tight">Investor</p>
            <p className="text-xs text-zinc-500 leading-tight">Manager</p>
          </div>
        </div>
      </div>
    </header>
  )
}
