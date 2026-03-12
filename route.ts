import { NextRequest, NextResponse } from 'next/server'
import { verifyHmacSignature } from '@/lib/webhooks/verify'
import { createAdminClient } from '@/lib/supabase/admin'
import { OpenSolarClient } from '@/lib/integrations/opensolar/client'
import { GhlClient } from '@/lib/integrations/ghl/client'
import { normalizeOpenSolarPayload } from '@/lib/integrations/sync/normalize-opensolar'
import { isDuplicateOpenSolarEvent } from '@/lib/integrations/sync/dedup-store'
import { resolveStageFromOpenSolar } from '@/lib/integrations/sync/stage-map'

function parseJsonEnv<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function logSyncEvent(input: {
  eventType: string
  payload: unknown
  result: Record<string, unknown>
}) {
  const admin = createAdminClient()
  await admin.from('sync_events').insert({
    provider: 'opensolar',
    direction: 'inbound',
    event_type: input.eventType,
    payload: input.payload,
    result: input.result,
  })
}

export async function POST(request: NextRequest) {
  let rawBody = ''

  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const secret = process.env.OPEN_SOLAR_WEBHOOK_SHARED_SECRET ?? ''
  const signature =
    request.headers.get('x-opensolar-signature') ??
    request.headers.get('x-opensolar-hmac-sha256') ??
    ''

  if (secret && !verifyHmacSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const normalized = normalizeOpenSolarPayload(payload)
  const duplicate = await isDuplicateOpenSolarEvent(normalized.event_id)
  if (duplicate) {
    await logSyncEvent({
      eventType: normalized.event,
      payload: { event_id: normalized.event_id },
      result: { success: true, skipped: true, reason: 'duplicate_event' },
    })
    return NextResponse.json({ received: true, skipped: true, reason: 'duplicate_event' })
  }

  if (!normalized.contact.email && !normalized.contact.phone) {
    await logSyncEvent({
      eventType: normalized.event,
      payload: { event_id: normalized.event_id, project_id: normalized.project.id },
      result: { success: false, error: 'Missing email and phone' },
    })
    return NextResponse.json({ error: 'Missing contact identity (email and phone)' }, { status: 400 })
  }

  const opensolarToken = process.env.OPEN_SOLAR_BEARER_TOKEN
  const opensolarOrgId = process.env.OPEN_SOLAR_ORG_ID
  const ghlToken = process.env.GHL_PRIVATE_INTEGRATION_TOKEN
  const ghlLocationId = process.env.GHL_LOCATION_ID
  const ghlPipelineId = process.env.GHL_PIPELINE_ID

  if (!opensolarToken || !opensolarOrgId || !ghlToken || !ghlLocationId || !ghlPipelineId) {
    return NextResponse.json(
      { error: 'Missing required integration secrets/config for OpenSolar/GHL sync' },
      { status: 500 }
    )
  }

  const opensolarClient = new OpenSolarClient({
    token: opensolarToken,
    orgId: opensolarOrgId,
    baseUrl: process.env.OPEN_SOLAR_API_BASE_URL,
  })

  const stageIdMap = parseJsonEnv<Record<string, string>>(process.env.GHL_STAGE_ID_MAP_JSON, {})
  const ghlClient = new GhlClient({
    token: ghlToken,
    locationId: ghlLocationId,
    pipelineId: ghlPipelineId,
    stageIdMap,
    baseUrl: process.env.GHL_API_BASE_URL,
    apiVersion: process.env.GHL_API_VERSION,
  })

  try {
    let files = normalized.files
    if (files.length === 0 && normalized.project.id != null) {
      files = await opensolarClient.getProjectFiles(normalized.project.id)
    }

    const defaultWorkflow = await opensolarClient.getDefaultWorkflow()
    const stageResolution = resolveStageFromOpenSolar({
      activeStageId: normalized.project.active_stage_id,
      stageName: normalized.project.stage_name,
    })

    if (stageResolution) {
      normalized.project.stage_number = stageResolution.stageNumber
      normalized.project.stage_name = stageResolution.stageName
    }

    const contact = await ghlClient.upsertContact({
      email: normalized.contact.email,
      phone: normalized.contact.phone,
      firstName: normalized.contact.first_name,
      lastName: normalized.contact.last_name,
    })

    const duplicateByField = await ghlClient.shouldSkipByLastEventId(contact.id, normalized.event_id)
    if (duplicateByField) {
      await logSyncEvent({
        eventType: normalized.event,
        payload: normalized,
        result: { success: true, skipped: true, reason: 'duplicate_by_last_event_id' },
      })
      return NextResponse.json({ received: true, skipped: true, reason: 'duplicate_by_last_event_id' })
    }

    const opportunity = await ghlClient.upsertOpportunity({
      contactId: contact.id,
      stageName: normalized.project.stage_name,
      payload: normalized,
    })

    let docsManifestJson: string | null = null
    let mirroredCount = 0
    let skippedCount = 0

    if (process.env.GHL_FILE_MIRROR_ENABLED === 'true' && files.length > 0) {
      const existingManifest = await ghlClient.getCustomFieldValue(contact.id, 'os_docs_manifest_json')
      const mirror = await ghlClient.mirrorFiles(contact.id, files, existingManifest)
      docsManifestJson = mirror.manifestJson
      mirroredCount = mirror.result.mirroredCount
      skippedCount = mirror.result.skippedCount
    }

    if (normalized.project.stage_number) {
      await ghlClient.setContactTags(contact.id, normalized.project.stage_number)
    }
    await ghlClient.setContactCustomFields(contact.id, normalized, docsManifestJson)

    const inboundWebhookUrl = process.env.GHL_INBOUND_WEBHOOK_URL
    if (inboundWebhookUrl) {
      await fetch(inboundWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.SYNC_SERVICE_INTERNAL_SECRET
            ? { 'x-sync-service-secret': process.env.SYNC_SERVICE_INTERNAL_SECRET }
            : {}),
        },
        body: JSON.stringify({
          ...normalized,
          workflow: defaultWorkflow,
          ghl_contact_id: contact.id,
          ghl_opportunity_id: opportunity.id,
          mirrored_files_count: mirroredCount,
          skipped_files_count: skippedCount,
        }),
      })
    }

    await logSyncEvent({
      eventType: normalized.event,
      payload: normalized,
      result: {
        success: true,
        ghl_contact_id: contact.id,
        ghl_opportunity_id: opportunity.id,
        stage_number: normalized.project.stage_number,
        mirrored_files_count: mirroredCount,
      },
    })

    return NextResponse.json({
      received: true,
      success: true,
      contact_id: contact.id,
      opportunity_id: opportunity.id,
      stage_number: normalized.project.stage_number,
      stage_name: normalized.project.stage_name,
      mirrored_files_count: mirroredCount,
      skipped_files_count: skippedCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected sync error'
    await logSyncEvent({
      eventType: normalized.event,
      payload: normalized,
      result: { success: false, error: message },
    })

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
