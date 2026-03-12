import { createAdminClient } from '@/lib/supabase/admin'

const MEMORY_TTL_MS = 7 * 24 * 60 * 60 * 1000
const memoryCache = new Map<string, number>()

function pruneMemoryCache() {
  const now = Date.now()
  memoryCache.forEach((created, key) => {
    if (now - created > MEMORY_TTL_MS) {
      memoryCache.delete(key)
    }
  })
}

export async function isDuplicateOpenSolarEvent(eventId: string): Promise<boolean> {
  pruneMemoryCache()
  if (memoryCache.has(eventId)) {
    return true
  }

  const admin = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - MEMORY_TTL_MS).toISOString()

  const { data } = await admin
    .from('sync_events')
    .select('id')
    .eq('provider', 'opensolar')
    .eq('direction', 'inbound')
    .contains('payload', { event_id: eventId })
    .gte('created_at', sevenDaysAgo)
    .limit(1)

  const duplicate = Boolean(data && data.length > 0)
  if (!duplicate) {
    memoryCache.set(eventId, Date.now())
  }

  return duplicate
}
