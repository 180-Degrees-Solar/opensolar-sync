import { resolveStageFromOpenSolar } from '@/lib/integrations/sync/stage-map'

export interface NormalizedOpenSolarFile {
  source_file_id: string
  name: string
  mime_type: string | null
  download_url: string
}

export interface NormalizedOpenSolarPayload {
  source: 'opensolar'
  event_id: string
  event: 'CREATE' | 'UPDATE' | 'DELETE'
  model: string
  timestamp: string
  project: {
    id: number | null
    identifier: string | null
    workflow_id: number | null
    active_stage_id: number | null
    stage_name: string | null
    stage_number: number | null
    contract_date: string | null
    installation_date: string | null
    price_total: number | null
    system_kw: number | null
    share_link: string | null
  }
  contact: {
    email: string | null
    phone: string | null
    first_name: string | null
    last_name: string | null
  }
  files: NormalizedOpenSolarFile[]
  raw: Record<string, unknown>
}

function asString(input: unknown): string | null {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    return String(input)
  }
  return null
}

function asNumber(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input
  }
  if (typeof input === 'string' && input.trim() !== '') {
    const n = Number(input)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function firstValue<T>(...values: (T | undefined | null)[]): T | null {
  for (const value of values) {
    if (value != null) {
      return value
    }
  }
  return null
}

function normalizeEventName(input: string | null): 'CREATE' | 'UPDATE' | 'DELETE' {
  const value = (input ?? '').toUpperCase()
  if (value.includes('CREATE')) return 'CREATE'
  if (value.includes('DELETE')) return 'DELETE'
  return 'UPDATE'
}

function inferModel(input: Record<string, unknown>): string {
  const raw = asString(firstValue(input.model, input.object, input.entity, input.resource))
  return raw ?? 'Project'
}

function normalizeFiles(input: unknown): NormalizedOpenSolarFile[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      const sourceId = asString(firstValue(record.id, record.file_id, record.source_file_id))
      const name = asString(firstValue(record.title, record.name, record.file_name))
      const downloadUrl = asString(firstValue(record.url, record.download_url, record.downloadUrl))

      if (!sourceId || !name || !downloadUrl) {
        return null
      }

      return {
        source_file_id: sourceId,
        name,
        mime_type: asString(firstValue(record.mimetype, record.mime_type, record.content_type)),
        download_url: downloadUrl,
      }
    })
    .filter((item): item is NormalizedOpenSolarFile => item != null)
}

export function normalizeOpenSolarPayload(raw: Record<string, unknown>): NormalizedOpenSolarPayload {
  const project = (raw.project as Record<string, unknown> | undefined) ?? {}
  const customer = (raw.customer as Record<string, unknown> | undefined) ?? {}
  const contact = (raw.contact as Record<string, unknown> | undefined) ?? {}
  const workflow = (project.workflow as Record<string, unknown> | undefined) ?? {}

  const activeStageId = asNumber(
    firstValue(
      workflow.active_stage_id,
      raw.active_stage_id,
      raw.stage_id,
      project.active_stage_id
    )
  )

  const stageName = asString(
    firstValue(
      raw.stage_name,
      project.stage_name,
      workflow.active_stage_title,
      workflow.active_stage_name
    )
  )

  const resolvedStage = resolveStageFromOpenSolar({
    activeStageId,
    stageName,
  })

  const eventId =
    asString(firstValue(raw.event_id, raw.id, raw.webhook_id, raw.uuid)) ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return {
    source: 'opensolar',
    event_id: eventId,
    event: normalizeEventName(asString(firstValue(raw.event, raw.action, raw.event_type))),
    model: inferModel(raw),
    timestamp: asString(firstValue(raw.timestamp, raw.created_at, raw.updated_at, raw.event_time)) ?? new Date().toISOString(),
    project: {
      id: asNumber(firstValue(raw.project_id, project.id)),
      identifier: asString(
        firstValue(
          raw.project_identifier,
          project.identifier,
          project.display_name,
          project.name
        )
      ),
      workflow_id: asNumber(firstValue(workflow.id, raw.workflow_id)),
      active_stage_id: activeStageId,
      stage_name: resolvedStage?.stageName ?? stageName,
      stage_number: resolvedStage?.stageNumber ?? null,
      contract_date: asString(firstValue(project.contract_date, raw.contract_date)),
      installation_date: asString(firstValue(project.installation_date, raw.installation_date)),
      price_total: asNumber(firstValue(project.price_total, raw.price_total, project.total)),
      system_kw: asNumber(firstValue(project.system_size_kw, raw.system_kw, project.system_kw)),
      share_link: asString(firstValue(project.share_link, raw.share_link)),
    },
    contact: {
      email: asString(firstValue(customer.email, contact.email, raw.email)),
      phone: asString(firstValue(customer.phone, contact.phone, raw.phone)),
      first_name: asString(firstValue(customer.first_name, contact.first_name, raw.first_name)),
      last_name: asString(firstValue(customer.last_name, contact.last_name, raw.last_name)),
    },
    files: normalizeFiles(firstValue(raw.files, raw.private_files, project.files)),
    raw,
  }
}
