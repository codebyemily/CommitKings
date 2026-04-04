'use client'

import { useEffect, useState } from 'react'

type ThemeChoice = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'forum-neighborhood-theme'

function readStored(): ThemeChoice {
  if (typeof window === 'undefined') return 'system'
  const v = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return 'system'
}

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'system') {
    root.removeAttribute('data-theme')
    localStorage.removeItem(STORAGE_KEY)
  } else {
    root.setAttribute('data-theme', choice)
    localStorage.setItem(STORAGE_KEY, choice)
  }
}

export function ProfileAppearance() {
  const [theme, setTheme] = useState<ThemeChoice>('system')

  useEffect(() => {
    const t = readStored()
    applyTheme(t)
    queueMicrotask(() => setTheme(t))
  }, [])

  function select(choice: ThemeChoice) {
    setTheme(choice)
    applyTheme(choice)
  }

  const choices: { id: ThemeChoice; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ]

  return (
    <div className="profile-appearance">
      <p className="profile-section-label">Appearance</p>
      <div className="profile-segment" role="group" aria-label="Theme">
        {choices.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`profile-segment-btn${theme === id ? ' profile-segment-btn-active' : ''}`}
            onClick={() => select(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="profile-hint">Applies to the main app while you’re browsing.</p>
    </div>
  )
}
