import type { Metadata } from 'next'
import { OneSignalProvider } from '@/components/push/OneSignalProvider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Forum Neighborhood',
    template: '%s · Forum Neighborhood',
  },
  description: 'Forum Neighborhood app',
  icons: {
    icon: [{ url: '/1058031.svg', type: 'image/svg+xml' }],
    apple: '/1058031.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <OneSignalProvider />
        {children}
      </body>
    </html>
  )
}
