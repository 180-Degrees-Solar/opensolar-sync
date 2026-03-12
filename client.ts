import crypto from 'crypto'
import type { NormalizedOpenSolarFile, NormalizedOpenSolarPayload } from '@/lib/integrations/sync/normalize-opensolar'

interface GhlClientConfig {
  token: string
  locationId: string
  pipelineId: string
  stageIdMap?: Record<string, string>
  baseUrl?: string
  apiVersion?: string
}

interface UpsertContactInput {
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
}

interface UpsertContactResult {
  id: string
  created: boolean
  raw: Record<string, unknown>
}

interface UpsertOpportunityResult {
  id: string
  created: boolean
}

interface FileMirrorResult {
  mirroredCount: number
  skippedCount: number
}

function normalizePhone(input: string | null): string | null {
  if (!input) return null
  const digits = input.replace(/[^\d+]/g, '')
  return digits.length > 0 ? digits : null
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function deepRead<T>(obj: unknown, keys: string[]): T | null {
  if (!obj || typeof obj !== 'object') {
    return null
  }

  const source = obj as Record<string, unknown>
  for (const key of keys) {
    const value = source[key]
    if (value != null) {
      return value as T
    }
  }
  return null
}

export class GhlClient {
  private readonly token: string
  private readonly locationId: string
  private readonly pipelineId: string
  private readonly stageIdMap: Record<string, string>
  private readonly baseUrl: string
  private readonly apiVersion: string

  constructor(config: GhlClientConfig) {
    this.token = config.token
    this.locationId = config.locationId
    this.pipelineId = config.pipelineId
    this.stageIdMap = config.stageIdMap ?? {}
    this.baseUrl = config.baseUrl ?? 'https://services.leadconnectorhq.com'
    this.apiVersion = config.apiVersion ?? '2021-07-28'
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Version: this.apiVersion,
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`GHL request failed (${response.status}) ${path}: ${body}`)
    }

    const text = await response.text()
    return (text ? JSON.parse(text) : {}) as T
  }

  private async searchContacts(query: string): Promise<Array<Record<string, unknown>>> {
    const data = await this.request<Record<string, unknown>>(
      `/contacts/?locationId=${encodeURIComponent(this.locationId)}&query=${encodeURIComponent(query)}`
    )
    const contacts = deepRead<Array<Record<string, unknown>>>(data, ['contacts', 'data'])
    return Array.isArray(contacts) ? contacts : []
  }

  private async getContactById(contactId: string): Promise<Record<string, unknown> | null> {
    const data = await this.request<Record<string, unknown>>(`/contacts/${contactId}`)
    return deepRead<Record<string, unknown>>(data, ['contact', 'data']) ?? data
  }

  private async createContact(input: UpsertContactInput): Promise<UpsertContactResult> {
    const payload = {
      locationId: this.locationId,
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      email: input.email ?? undefined,
      phone: normalizePhone(input.phone) ?? undefined,
    }

    const data = await this.request<Record<string, unknown>>('/contacts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const contact = deepRead<Record<string, unknown>>(data, ['contact', 'data']) ?? data
    const id = String(deepRead<string | number>(contact, ['id', '_id']))
    return { id, created: true, raw: contact }
  }

  private async updateContact(contactId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const data = await this.request<Record<string, unknown>>(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    return deepRead<Record<string, unknown>>(data, ['contact', 'data']) ?? data
  }

  async upsertContact(input: UpsertContactInput): Promise<UpsertContactResult> {
    let found: Record<string, unknown> | null = null

    if (input.email) {
      const results = await this.searchContacts(input.email)
      found =
        results.find((c) => {
          const email = deepRead<string>(c, ['email'])
          return email?.toLowerCase() === input.email?.toLowerCase()
        }) ?? null
    }

    if (!found && input.phone) {
      const normalizedPhone = normalizePhone(input.phone)
      if (normalizedPhone) {
        const results = await this.searchContacts(normalizedPhone)
        found =
          results.find((c) => {
            const phone = normalizePhone(deepRead<string>(c, ['phone']))
            return phone === normalizedPhone
          }) ?? null
      }
    }

    if (!found) {
      return this.createContact(input)
    }

    const contactId = String(deepRead<string | number>(found, ['id', '_id']))
    const updated = await this.updateContact(contactId, {
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      email: input.email ?? undefined,
      phone: normalizePhone(input.phone) ?? undefined,
    })

    return { id: contactId, created: false, raw: updated }
  }

  private async listContactOpportunities(contactId: string): Promise<Array<Record<string, unknown>>> {
    const data = await this.request<Record<string, unknown>>(
      `/opportunities/search?location_id=${encodeURIComponent(this.locationId)}&pipeline_id=${encodeURIComponent(this.pipelineId)}&contact_id=${encodeURIComponent(contactId)}`
    )

    const opportunities = deepRead<Array<Record<string, unknown>>>(data, ['opportunities', 'data'])
    return Array.isArray(opportunities) ? opportunities : []
  }

  private async createOpportunity(input: {
    contactId: string
    stageId: string | null
    payload: NormalizedOpenSolarPayload
  }): Promise<UpsertOpportunityResult> {
    const data = await this.request<Record<string, unknown>>('/opportunities/', {
      method: 'POST',
      body: JSON.stringify({
        locationId: this.locationId,
        pipelineId: this.pipelineId,
        contactId: input.contactId,
        stageId: input.stageId ?? undefined,
        status: 'open',
        title: input.payload.project.identifier ?? `OpenSolar ${input.payload.project.id ?? 'Project'}`,
      }),
    })

    const opp = deepRead<Record<string, unknown>>(data, ['opportunity', 'data']) ?? data
    const id = String(deepRead<string | number>(opp, ['id', '_id']))
    return { id, created: true }
  }

  private async updateOpportunity(opportunityId: string, input: {
    stageId: string | null
    payload: NormalizedOpenSolarPayload
  }): Promise<void> {
    await this.request(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify({
        stageId: input.stageId ?? undefined,
        title: input.payload.project.identifier ?? undefined,
      }),
    })
  }

  resolveGhlStageId(stageName: string | null): string | null {
    if (!stageName) {
      return null
    }
    return this.stageIdMap[stageName] ?? null
  }

  async upsertOpportunity(params: {
    contactId: string
    stageName: string | null
    payload: NormalizedOpenSolarPayload
  }): Promise<UpsertOpportunityResult> {
    const stageId = this.resolveGhlStageId(params.stageName)
    const opportunities = await this.listContactOpportunities(params.contactId)
    const existing = opportunities[0]

    if (!existing) {
      return this.createOpportunity({
        contactId: params.contactId,
        stageId,
        payload: params.payload,
      })
    }

    const opportunityId = String(deepRead<string | number>(existing, ['id', '_id']))
    await this.updateOpportunity(opportunityId, {
      stageId,
      payload: params.payload,
    })
    return { id: opportunityId, created: false }
  }

  async setContactTags(contactId: string, stageNumber: number): Promise<void> {
    const contact = await this.getContactById(contactId)
    const existingTags = deepRead<string[]>(contact, ['tags']) ?? []
    const retained = existingTags.filter((tag) => !tag.startsWith('os:stage:'))
    const tags = [
      ...retained,
      `os:stage:${stageNumber}`,
      'os:sync:ok',
    ]

    await this.updateContact(contactId, { tags })
  }

  async markDocsMirroredTag(contactId: string): Promise<void> {
    const contact = await this.getContactById(contactId)
    const existingTags = deepRead<string[]>(contact, ['tags']) ?? []
    const tags = existingTags.includes('os:docs:mirrored')
      ? existingTags
      : [...existingTags, 'os:docs:mirrored']

    await this.updateContact(contactId, { tags })
  }

  async setContactCustomFields(
    contactId: string,
    payload: NormalizedOpenSolarPayload,
    docsManifestJson: string | null
  ): Promise<void> {
    await this.updateContact(contactId, {
      customFields: [
        { key: 'os_project_id', field_value: payload.project.id != null ? String(payload.project.id) : '' },
        { key: 'os_project_identifier', field_value: payload.project.identifier ?? '' },
        { key: 'os_workflow_id', field_value: payload.project.workflow_id != null ? String(payload.project.workflow_id) : '' },
        { key: 'os_active_stage_id', field_value: payload.project.active_stage_id != null ? String(payload.project.active_stage_id) : '' },
        { key: 'os_stage_name', field_value: payload.project.stage_name ?? '' },
        { key: 'os_share_link', field_value: payload.project.share_link ?? '' },
        { key: 'os_contract_date', field_value: payload.project.contract_date ?? '' },
        { key: 'os_installation_date', field_value: payload.project.installation_date ?? '' },
        { key: 'os_system_kw', field_value: payload.project.system_kw != null ? String(payload.project.system_kw) : '' },
        { key: 'os_price_total', field_value: payload.project.price_total != null ? String(payload.project.price_total) : '' },
        { key: 'os_last_event_id', field_value: payload.event_id },
        { key: 'os_last_synced_at', field_value: new Date().toISOString() },
        { key: 'os_docs_manifest_json', field_value: docsManifestJson ?? '' },
      ],
    })
  }

  async shouldSkipByLastEventId(contactId: string, eventId: string): Promise<boolean> {
    const contact = await this.getContactById(contactId)
    const customFields = deepRead<Array<Record<string, unknown>>>(contact, ['customFields', 'custom_fields']) ?? []
    const lastEventField = customFields.find((field) => {
      const key = deepRead<string>(field, ['key', 'name', 'id'])
      return key === 'os_last_event_id'
    })
    const lastValue = deepRead<string>(lastEventField, ['field_value', 'value'])
    return lastValue === eventId
  }

  async getCustomFieldValue(contactId: string, key: string): Promise<string | null> {
    const contact = await this.getContactById(contactId)
    const customFields = deepRead<Array<Record<string, unknown>>>(contact, ['customFields', 'custom_fields']) ?? []
    const targetField = customFields.find((field) => {
      const fieldKey = deepRead<string>(field, ['key', 'name', 'id'])
      return fieldKey === key
    })
    return deepRead<string>(targetField, ['field_value', 'value']) ?? null
  }

  private async downloadFile(file: NormalizedOpenSolarFile): Promise<Blob> {
    const response = await fetch(file.download_url, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Could not download OpenSolar file ${file.source_file_id}`)
    }
    return response.blob()
  }

  private async uploadFileToMedia(file: NormalizedOpenSolarFile): Promise<string | null> {
    const blob = await this.downloadFile(file)
    const form = new FormData()
    const ext = file.name.includes('.') ? '' : '.pdf'
    const filename = `${file.name}${ext}`
    form.append('file', new File([blob], filename, { type: file.mime_type ?? 'application/octet-stream' }))

    const response = await fetch(`${this.baseUrl}/medias/upload-file?locationId=${encodeURIComponent(this.locationId)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Version: this.apiVersion,
      },
      body: form,
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as Record<string, unknown>
    return deepRead<string>(data, ['url', 'fileUrl', 'mediaUrl'])
  }

  async mirrorFiles(
    contactId: string,
    files: NormalizedOpenSolarFile[],
    existingManifestJson: string | null
  ): Promise<{ manifestJson: string; result: FileMirrorResult }> {
    const parsed = safeJsonParse<Record<string, { hash: string; url: string; mirrored_at: string }>>(existingManifestJson) ?? {}
    let mirroredCount = 0
    let skippedCount = 0

    for (const file of files) {
      const hash = crypto
        .createHash('sha256')
        .update(`${file.source_file_id}|${file.name}|${file.download_url}`)
        .digest('hex')

      const current = parsed[file.source_file_id]
      if (current?.hash === hash) {
        skippedCount += 1
        continue
      }

      const url = await this.uploadFileToMedia(file)
      if (!url) {
        continue
      }

      parsed[file.source_file_id] = {
        hash,
        url,
        mirrored_at: new Date().toISOString(),
      }
      mirroredCount += 1
    }

    if (mirroredCount > 0) {
      await this.markDocsMirroredTag(contactId)
    }

    return {
      manifestJson: JSON.stringify(parsed),
      result: {
        mirroredCount,
        skippedCount,
      },
    }
  }
}
