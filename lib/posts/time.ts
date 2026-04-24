export function formatPostTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const diffMs = Date.now() - d.getTime()

  // Future timestamps: negative relative deltas would read wrong (e.g. "-5s ago").
  if (diffMs < 0) {
    const skewMs = 120_000
    if (diffMs > -skewMs) return 'just now'
    return d.toISOString().slice(0, 10)
  }

  const sec = Math.floor(diffMs / 1000)
  if (sec < 10) return 'just now'
  if (sec < 60) return `${sec}s ago`

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`

  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`

  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
