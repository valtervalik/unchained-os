'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'

export function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
