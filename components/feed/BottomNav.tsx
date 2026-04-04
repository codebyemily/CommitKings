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
      <button type="button" className="feed-nav-item" aria-label="Search (coming soon)">
        <IconSearch title="Search" />
      </button>
      <button type="button" className="feed-nav-item" aria-label="Create (coming soon)">
        <IconCreate title="Create" />
      </button>
      <button type="button" className="feed-nav-item" aria-label="Messages (coming soon)">
        <IconMessages title="Messages" />
      </button>
      <button type="button" className="feed-nav-item" aria-label="Profile (coming soon)">
        <IconProfile title="Profile" />
      </button>
    </nav>
  )
}
