'use client'

import { useState } from 'react'

/** UI-only toggle until push is wired up. */
export function ProfileNotificationsToggle() {
  const [on, setOn] = useState(true)

  return (
    <div className="profile-row">
      <div>
        <p className="profile-row-title">Message notifications</p>
        <p className="profile-row-desc">Get notified about new DMs and mentions</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`profile-switch${on ? ' profile-switch-on' : ''}`}
        onClick={() => setOn((v) => !v)}
      >
        <span className="profile-switch-knob" />
      </button>
    </div>
  )
}
