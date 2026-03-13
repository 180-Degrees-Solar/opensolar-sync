import type { Update } from '@/lib/types'

interface UpdateFeedProps {
  updates: Update[]
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffWeek < 4) return `${diffWeek}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function UpdateFeed({ updates }: UpdateFeedProps) {
  if (updates.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-400">
        No updates yet
      </div>
    )
  }

  // Reverse chronological order
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-3">
      {sortedUpdates.map((update) => (
        <div
          key={update.id}
          className="border-l-4 border-teal-400 bg-gray-50 rounded-r-lg px-4 py-3"
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.body}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {update.created_by ? 'Team' : 'System'}
            </span>
            <span className="text-xs text-gray-400">
              {relativeTime(update.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
