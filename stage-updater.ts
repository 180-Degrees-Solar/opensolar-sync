import { createAdminClient } from '@/lib/supabase/admin'
import { getStageByNumber } from '@/lib/constants/stages'
import type { Project } from '@/lib/types'

interface AdvanceResult {
  success: boolean
  error?: string
}

/**
 * Advance a project to a specific stage. Idempotent: if the project is already
 * at or past the target stage, returns success without changes.
 */
export async function advanceProjectToStage(
  projectId: string,
  targetStage: number,
  source: string
): Promise<AdvanceResult> {
  const admin = createAdminClient()

  // 1. Fetch current project
  const { data: project, error: fetchError } = await admin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (fetchError || !project) {
    return {
      success: false,
      error: fetchError?.message ?? 'Project not found.',
    }
  }

  // 2. Idempotent: if already at or past target stage, no-op
  if (project.current_stage_number >= targetStage) {
    return { success: true }
  }

  const now = new Date().toISOString()
  const stageDef = getStageByNumber(targetStage)
  const stageTitle = stageDef?.title ?? `Stage ${targetStage}`

  // 3. Update project's current_stage_number and sync_status
  const { error: updateError } = await admin
    .from('projects')
    .update({
      current_stage_number: targetStage,
      sync_status: 'ok',
      updated_at: now,
    })
    .eq('id', projectId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // 4. Mark all stages < targetStage as 'done'
  await admin
    .from('stages')
    .update({
      status: 'done',
      completed_at: now,
      updated_at: now,
    })
    .eq('project_id', projectId)
    .lt('stage_number', targetStage)

  // 5. Mark targetStage as 'in_progress'
  await admin
    .from('stages')
    .update({
      status: 'in_progress',
      started_at: now,
      completed_at: null,
      updated_at: now,
    })
    .eq('project_id', projectId)
    .eq('stage_number', targetStage)

  // 6. Insert an update entry
  await admin.from('updates').insert({
    project_id: projectId,
    stage_number: targetStage,
    body: `Project moved to ${stageTitle} via ${source}.`,
  })

  // 7. Notify all project members
  const { data: members } = await admin
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)

  if (members && members.length > 0) {
    const notifications = members.map((member) => ({
      user_id: member.user_id,
      project_id: projectId,
      title: `Project advanced to ${stageTitle}`,
      body: `Your project has moved to stage ${targetStage}: ${stageTitle} (updated via ${source}).`,
      is_read: false,
    }))

    await admin.from('notifications').insert(notifications)
  }

  return { success: true }
}

/**
 * Find a project by one or more external identifiers.
 * Priority: portal_project_id (direct ID) > opensolar_project_identifier > contact email lookup.
 */
export async function findProjectByIdentifiers(
  portalId?: string | null,
  opensolarId?: string | null,
  contactEmail?: string | null
): Promise<Project | null> {
  const admin = createAdminClient()

  // 1. Try direct portal project ID
  if (portalId) {
    const { data } = await admin
      .from('projects')
      .select('*')
      .eq('id', portalId)
      .single()

    if (data) return data
  }

  // 2. Try OpenSolar project identifier
  if (opensolarId) {
    const { data } = await admin
      .from('projects')
      .select('*')
      .eq('opensolar_project_identifier', opensolarId)
      .single()

    if (data) return data
  }

  // 3. Try contact email: profiles -> project_members -> projects
  if (contactEmail) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', contactEmail.toLowerCase())
      .single()

    if (profile) {
      const { data: membership } = await admin
        .from('project_members')
        .select('project_id')
        .eq('user_id', profile.id)
        .limit(1)
        .single()

      if (membership) {
        const { data: project } = await admin
          .from('projects')
          .select('*')
          .eq('id', membership.project_id)
          .single()

        if (project) return project
      }
    }
  }

  return null
}
