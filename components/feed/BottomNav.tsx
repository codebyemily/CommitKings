'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconCreate,
  IconHome,
  IconMessages,
  IconProfile,
  IconSearch,
} from './FeedIcons'

export function BottomNav() {
  const pathname = usePathname()
  const homeActive = pathname === '/home'
  const searchActive = pathname === '/search'
  const messagesActive = pathname === '/messages'
  const profileActive = pathname === '/profile'

  return (
    <nav className="feed-bottom-nav" aria-label="Primary">
      <Link
        href="/home"
        className="feed-nav-item"
        aria-label="Home"
        aria-current={homeActive ? 'page' : undefined}
      >
        <IconHome active={homeActive} title="Home" />
      </Link>
      <Link
        href="/search"
        className="feed-nav-item"
        aria-label="Search"
        aria-current={searchActive ? 'page' : undefined}
      >
        <IconSearch active={searchActive} title="Search" />
      </Link>
      <button type="button" className="feed-nav-item" aria-label="Create (coming soon)">
        <IconCreate title="Create" />
      </button>
      <Link
        href="/messages"
        className="feed-nav-item"
        aria-label="Messages"
        aria-current={messagesActive ? 'page' : undefined}
      >
        <IconMessages active={messagesActive} title="Messages" />
      </Link>
      <Link
        href="/profile"
        className="feed-nav-item"
        aria-label="Profile"
        aria-current={profileActive ? 'page' : undefined}
      >
        <IconProfile active={profileActive} title="Profile" />
      </Link>
    </nav>
  )
}
