#!/usr/bin/env node

const token = process.env.OPEN_SOLAR_BEARER_TOKEN
const orgId = process.env.OPEN_SOLAR_ORG_ID
const endpoint = process.env.OPEN_SOLAR_WEBHOOK_ENDPOINT
const secret = process.env.OPEN_SOLAR_WEBHOOK_SHARED_SECRET
const baseUrl = process.env.OPEN_SOLAR_API_BASE_URL || 'https://api.opensolar.com'

if (!token || !orgId || !endpoint) {
  console.error('Missing OPEN_SOLAR_BEARER_TOKEN, OPEN_SOLAR_ORG_ID, or OPEN_SOLAR_WEBHOOK_ENDPOINT')
  process.exit(1)
}

const triggerFields = process.env.OPEN_SOLAR_TRIGGER_FIELDS_JSON
  ? JSON.parse(process.env.OPEN_SOLAR_TRIGGER_FIELDS_JSON)
  : ['project.*', 'project.workflow.active_stage_id', 'project.updated_at', 'event_type_id']

const payloadFields = process.env.OPEN_SOLAR_PAYLOAD_FIELDS_JSON
  ? JSON.parse(process.env.OPEN_SOLAR_PAYLOAD_FIELDS_JSON)
  : [
      'id',
      'event_type_id',
      'project_id',
      'project.id',
      'project.identifier',
      'project.workflow.id',
      'project.workflow.active_stage_id',
      'project.contract_date',
      'project.installation_date',
      'project.price_total',
      'project.system_size_kw',
      'project.share_link',
      'customer.email',
      'customer.phone',
      'customer.first_name',
      'customer.last_name',
    ]

const body = {
  endpoint,
  enabled: true,
  debug: false,
  trigger_fields: triggerFields,
  payload_fields: payloadFields,
  ...(secret ? { secret } : {}),
}

const response = await fetch(`${baseUrl}/api/orgs/${orgId}/webhooks/`, {
  method: 'POST',
  headers: {
    Authorization: token,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify(body),
})

const text = await response.text()
if (!response.ok) {
  console.error(`Webhook creation failed (${response.status}): ${text}`)
  process.exit(1)
}

console.log(text)
