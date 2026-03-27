import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Unchained OS',
  description: 'Private Equity Operating System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-zinc-950 text-zinc-100">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5' },
          }}
        />
      </body>
    </html>
  )
}
