import type { Metadata } from 'next'
import { Noto_Sans_Myanmar, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const myanmarFont = Noto_Sans_Myanmar({
  variable: '--font-sans',
  subsets: ['latin', 'myanmar'],
  weight: ['300', '400', '500', '600', '700'],
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
      className={`${myanmarFont.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-background text-foreground">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: '#6b1877', border: '1px solid #9a18b3', color: '#fcf4ff' },
          }}
        />
      </body>
    </html>
  )
}
