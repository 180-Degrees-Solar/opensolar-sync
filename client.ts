import type { NormalizedOpenSolarFile } from '@/lib/integrations/sync/normalize-opensolar'

interface OpenSolarClientConfig {
  token: string
  orgId: string
  baseUrl?: string
}

interface OpenSolarWorkflowStage {
  id: number
  title: string
}

interface OpenSolarWorkflow {
  id: number
  title: string
  is_default?: boolean
  workflow_stages?: OpenSolarWorkflowStage[]
}

export class OpenSolarClient {
  private readonly token: string
  private readonly orgId: string
  private readonly baseUrl: string

  constructor(config: OpenSolarClientConfig) {
    this.token = config.token
    this.orgId = config.orgId
    this.baseUrl = config.baseUrl ?? 'https://api.opensolar.com'
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: this.token,
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenSolar request failed (${response.status}): ${body}`)
    }

    return (await response.json()) as T
  }

  async getDefaultWorkflow(): Promise<OpenSolarWorkflow | null> {
    const data = await this.request<OpenSolarWorkflow[]>(
      `/api/orgs/${this.orgId}/workflows/?is_default=true`
    )
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }
    return data[0]
  }

  async getProject(projectId: number): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/orgs/${this.orgId}/projects/${projectId}/`)
  }

  async getProjectFiles(projectId: number): Promise<NormalizedOpenSolarFile[]> {
    const projectRef = encodeURIComponent(`/api/orgs/${this.orgId}/projects/${projectId}/`)
    const data = await this.request<Array<Record<string, unknown>>>(
      `/api/orgs/${this.orgId}/private_files/?project=${projectRef}`
    )

    if (!Array.isArray(data)) {
      return []
    }

    return data
      .map((item) => {
        const sourceId = item.id != null ? String(item.id) : null
        const name = typeof item.title === 'string' ? item.title : (typeof item.name === 'string' ? item.name : null)
        const mimeType = typeof item.mimetype === 'string' ? item.mimetype : null
        const downloadUrl =
          typeof item.file === 'string'
            ? item.file
            : (typeof item.url === 'string' ? item.url : null)

        if (!sourceId || !name || !downloadUrl) {
          return null
        }

        return {
          source_file_id: sourceId,
          name,
          mime_type: mimeType,
          download_url: downloadUrl,
        }
      })
      .filter((item): item is NormalizedOpenSolarFile => item != null)
  }
}
