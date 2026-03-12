#!/usr/bin/env node

const token = process.env.OPEN_SOLAR_BEARER_TOKEN
const orgId = process.env.OPEN_SOLAR_ORG_ID
const baseUrl = process.env.OPEN_SOLAR_API_BASE_URL || 'https://api.opensolar.com'

if (!token || !orgId) {
  console.error('Missing OPEN_SOLAR_BEARER_TOKEN or OPEN_SOLAR_ORG_ID')
  process.exit(1)
}

const response = await fetch(`${baseUrl}/api/orgs/${orgId}/workflows/?is_default=true`, {
  headers: {
    Authorization: token,
    Accept: 'application/json',
  },
})

if (!response.ok) {
  console.error(`Request failed (${response.status}): ${await response.text()}`)
  process.exit(1)
}

const workflows = await response.json()
if (!Array.isArray(workflows) || workflows.length === 0) {
  console.error('No default workflow found.')
  process.exit(1)
}

const workflow = workflows[0]
const stages = Array.isArray(workflow.workflow_stages) ? workflow.workflow_stages : []
const stageMap = Object.fromEntries(
  stages.map((stage, idx) => [String(stage.id), idx + 1])
)

console.log(JSON.stringify({
  workflow_id: workflow.id,
  workflow_title: workflow.title,
  stages: stages.map((stage, idx) => ({
    stage_number: idx + 1,
    opensolar_stage_id: stage.id,
    title: stage.title,
  })),
  opensolar_stage_id_map_json: stageMap,
}, null, 2))
