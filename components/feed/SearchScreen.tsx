'use client'

import { searchProfilesAction, type ProfileSearchHit } from '@/app/actions/search'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BottomNav } from './BottomNav'
import { FeedHeader } from './FeedHeader'

function avatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  try {
    return getPostImagePublicUrl(path.trim())
  } catch {
    return null
  }
}

type SearchScreenProps = {
  viewerId: string
}

export function SearchScreen({ viewerId }: SearchScreenProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileSearchHit[]>([])
  const [loading, setLoading] = useState(false)

  const trimmed = query.trim().replace(/^@+/, '')
  const displayResults = trimmed.length >= 2 ? results : []

  useEffect(() => {
    if (trimmed.length < 2) {
      return
    }

    const q = query
    const timer = window.setTimeout(() => {
      setLoading(true)
      void (async () => {
        const hits = await searchProfilesAction(q)
        setResults(hits)
        setLoading(false)
      })()
    }, 280)

    return () => window.clearTimeout(timer)
  }, [query, trimmed])

  const hint =
    trimmed.length === 0
      ? 'Search by username or display name (at least 2 characters).'
      : trimmed.length === 1
        ? 'Keep typing — need at least 2 characters.'
        : loading
          ? 'Searching…'
          : displayResults.length === 0
            ? 'No users found.'
            : null

  return (
    <div className="feed-app">
      <FeedHeader />
      <main className="feed-main">
        <div className="feed-search-wrap">
          <label className="sr-only" htmlFor="feed-search">
            Search users
          </label>
          <input
            id="feed-search"
            name="q"
            type="search"
            className="feed-search-input"
            placeholder="Search users by name or @handle"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {hint ? (
            <p className="feed-search-hint">{hint}</p>
          ) : (
            <ul className="feed-search-results" aria-label="Search results">
              {displayResults.map((hit) => {
                const src = avatarSrc(hit.avatarPath)
                const initial = (hit.displayName || hit.username)
                  .slice(0, 1)
                  .toUpperCase()
                const withParam = encodeURIComponent(hit.username)
                const isSelf = hit.id === viewerId
                const href = isSelf ? '/profile' : `/messages?with=${withParam}`
                return (
                  <li key={hit.id}>
                    <Link href={href} className="feed-search-hit-row">
                      <div className="feed-msg-conv-avatar-wrap">
                        {src ? (
                          <Image
                            src={src}
                            alt=""
                            width={48}
                            height={48}
                            className="feed-avatar feed-msg-conv-avatar"
                            unoptimized
                          />
                        ) : (
                          <span className="feed-avatar-fallback feed-msg-conv-avatar-fallback">
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="feed-msg-conv-body">
                        <div className="feed-msg-conv-top">
                          <span className="feed-msg-conv-name">
                            {hit.displayName}
                          </span>
                        </div>
                        <p className="feed-search-hit-handle">@{hit.username}</p>
                        <p className="feed-search-hit-action">
                          {isSelf ? 'Your profile' : 'Open messages'}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
