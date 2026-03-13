'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface CreateProjectInput {
  name: string
  address: string
  clientEmail: string
  opensolarProjectIdentifier: string
  ghlOpportunityId: string
  ghlContactId: string
}

interface CreateProjectResult {
  success: boolean
  projectId?: string
  error?: string
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  const supabase = await createClient()

  // Verify the current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Admin access required.' }
  }

  if (!input.name.trim()) {
    return { success: false, error: 'Project name is required.' }
  }

  // Use admin client to bypass RLS for cross-user operations
  const admin = createAdminClient()

  // Create the project
  const { data: project, error: projectError } = await admin
    .from('projects')
    .insert({
      name: input.name.trim(),
      address: input.address.trim() || null,
      opensolar_project_identifier: input.opensolarProjectIdentifier.trim() || null,
      ghl_opportunity_id: input.ghlOpportunityId.trim() || null,
      ghl_contact_id: input.ghlContactId.trim() || null,
      current_stage_number: 1,
      sync_status: 'ok',
    })
    .select('id')
    .single()

  if (projectError || !project) {
    return {
      success: false,
      error: projectError?.message ?? 'Failed to create project.',
    }
  }

  // Initialize stages via RPC
  const { error: rpcError } = await admin.rpc('initialize_project_stages', {
    p_project_id: project.id,
  })

  if (rpcError) {
    // Attempt to clean up the project if stage initialization fails
    await admin.from('projects').delete().eq('id', project.id)
    return {
      success: false,
      error: `Failed to initialize stages: ${rpcError.message}`,
    }
  }

  // Link client user if email provided
  if (input.clientEmail.trim()) {
    const { data: clientProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', input.clientEmail.trim().toLowerCase())
      .single()

    if (clientProfile) {
      const { error: memberError } = await admin.from('project_members').insert({
        project_id: project.id,
        user_id: clientProfile.id,
        role: 'owner',
      })

      if (memberError) {
        // Non-fatal: project was created, but linking failed
        console.error('Failed to link client:', memberError.message)
      }
    }
    // If no client profile found, the project is still created successfully
    // The admin can link them later when the client registers
  }

  revalidatePath('/admin/projects')
  revalidatePath('/admin')

  return { success: true, projectId: project.id }
}
