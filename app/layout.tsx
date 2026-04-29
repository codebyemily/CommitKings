import type { Metadata } from 'next'
import './globals.css'
import OneSignalInit from '@/components/notifications/OneSignalInit'

export const metadata: Metadata = {
  title: {
    default: 'Forum Neighborhood',
    template: '%s · Forum Neighborhood',
  },
  description: 'Forum Neighborhood app',
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
    apple: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeInitScript = `
    (function () {
      try {
        var key = 'forum-neighborhood-theme';
        var value = localStorage.getItem(key);
        var root = document.documentElement;
        if (value === 'dark' || value === 'light') {
          root.setAttribute('data-theme', value);
        } else {
          root.removeAttribute('data-theme');
        }
      } catch (e) {
        document.documentElement.removeAttribute('data-theme');
      }
    })();
  `

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <OneSignalInit />
        {children}
      </body>
    </html>
  )
}
