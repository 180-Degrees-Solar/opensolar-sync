import type { Database } from '@/lib/supabase/database.types'

// Convenience type aliases from database types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectMember = Database['public']['Tables']['project_members']['Row']
export type Stage = Database['public']['Tables']['stages']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Update = Database['public']['Tables']['updates']['Row']
export type SyncEvent = Database['public']['Tables']['sync_events']['Row']

// Enum-like types
export type UserRole = 'client' | 'admin'
export type StageStatus = 'not_started' | 'in_progress' | 'done'
export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type MemberRole = 'owner' | 'member' | 'admin'
export type SyncStatus = 'ok' | 'syncing' | 'error' | 'conflict'
export type WebhookProvider = 'gohighlevel' | 'opensolar'

// Composite types for the UI
export interface ProjectWithStages extends Project {
  stages: Stage[]
}

export interface StageWithDetails extends Stage {
  tasks: Task[]
  documents: Document[]
  updates: Update[]
}
