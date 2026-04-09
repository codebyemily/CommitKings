import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Forum Neighborhood',
    template: '%s · Forum Neighborhood',
  },
  description: 'Forum Neighborhood app',
  icons: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
