# GHL + OpenSolar Snapshot Runbook

This runbook implements the OpenSolar-synced project management Client Portal for location `PSr0Nobj9m4lBrO9LPEY`.

## 1) Required Environment Variables

Set these in `.env.local` (never commit live values):

```bash
OPEN_SOLAR_ORG_ID=22582
OPEN_SOLAR_BEARER_TOKEN=
OPEN_SOLAR_WEBHOOK_SHARED_SECRET=
OPEN_SOLAR_API_BASE_URL=https://api.opensolar.com

GHL_PRIVATE_INTEGRATION_TOKEN=
GHL_LOCATION_ID=PSr0Nobj9m4lBrO9LPEY
GHL_PIPELINE_ID=2zJrL7euC76Jt9wHQtUZ
GHL_STAGE_ID_MAP_JSON={"Contracts":"35873ced-7bc4-4955-a913-2fc42c3f58a1","Design":"50ea5c4f-2367-4c52-ab90-69de71f94433","Site Schedule":"c943ba23-6253-42ba-9aaf-b282ea01a594","Design & Engineering":"c6a5d98c-169b-4032-995b-e849680b97e7","Notice to Proceed":"4c78d2a4-e5db-48b8-9c5e-042eeda27da6","Permitting / Utility / HOA":"fbfaf7e5-b7aa-434c-a466-4a22543a7302","Installation Scheduled":"b48810c5-1da1-47f8-b91d-6e0d0db11ce6","Financing Package":"c5580016-f346-4910-94d9-e189df6b5ed8","Inspection":"9ff1cee1-22be-4a65-b8d1-a6df4cd1a6be","PTO & O&M":"d8aad801-8353-4e33-a800-a550f55c897c"}
GHL_API_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
GHL_FILE_MIRROR_ENABLED=true
GHL_INBOUND_WEBHOOK_URL=

OPENSOLAR_STAGE_ID_MAP_JSON={"976783":1,"976784":2,"976785":3,"976790":4,"976786":5,"976788":6,"976787":7,"976789":8}
SYNC_SERVICE_INTERNAL_SECRET=
```

## 2) API Route Implemented

OpenSolar webhook target endpoint in this app:

`POST /api/sync/opensolar`

Route behavior:
1. Verifies HMAC signature (if secret configured)
2. Normalizes OpenSolar payload to stable internal shape
3. Performs dedup (7-day cache check with `sync_events` + in-memory cache)
4. Upserts contact (email first, phone fallback) in GHL
5. Upserts opportunity in the 10-stage pipeline
6. Applies stage tags and writes `os_*` custom fields
7. Mirrors OpenSolar files into GHL media
8. Forwards normalized payload to optional GHL inbound webhook
9. Logs result to `sync_events`

## 3) Build OpenSolar Stage Map

Fetch the default workflow and produce `OPENSOLAR_STAGE_ID_MAP_JSON`:

```bash
node scripts/fetch-opensolar-default-workflow.mjs
```

Copy the `opensolar_stage_id_map_json` output into `.env.local`.

## 4) Create OpenSolar Webhook

Set:

```bash
OPEN_SOLAR_WEBHOOK_ENDPOINT=https://the180ai.app.n8n.cloud/webhook/opensolar-ghl-sync
```

Then create:

```bash
node scripts/create-opensolar-webhook.mjs
```

If using n8n as relay, import:

- `docs/n8n-opensolar-relay-workflow.json`

Set n8n env var:

- `SYNC_APP_URL=https://<your-sync-app-domain>`

## 5) GHL Snapshot Objects to Create in Sub-Account

Create these in GHL before snapshot export:

1. Pipeline: `Solar Project Pipeline` with exact stage names:
   - Contracts
   - Design
   - Site Schedule
   - Design & Engineering
   - Notice to Proceed
   - Permitting / Utility / HOA
   - Installation Scheduled
   - Financing Package
   - Inspection
   - PTO & O&M
2. Tags:
   - `os:stage:1`..`os:stage:10`
   - `os:sync:ok`
   - `os:sync:error`
   - `os:docs:mirrored`
   - `os:docs:pending`
   - `os:event:stage_change`
3. Custom fields:
   - `os_project_id`
   - `os_project_identifier`
   - `os_workflow_id`
   - `os_active_stage_id`
   - `os_stage_name`
   - `os_share_link`
   - `os_contract_date`
   - `os_installation_date`
   - `os_system_kw`
   - `os_price_total`
   - `os_last_event_id`
   - `os_last_synced_at`
   - `os_docs_manifest_json`
4. Workflows:
   - `OS Inbound - Contact/Opportunity Upsert`
   - `OS Inbound - Stage Mapper`
   - `OS Inbound - Tag + Field Sync`
   - `OS Inbound - Portal Notification`
   - `OS Inbound - Error Handler`
   - `OS Inbound - Dedup Guard`
5. Client Portal:
   - Enable: Courses, Documents/Contracts, Estimates, Invoices, Chat Widget
   - Set default page to Courses
6. Course:
   - `Project Journey (10 Stages)` with one module per stage

## 6) OpenSolar Default Workflow (Create/Confirm)

Create one default workflow in OpenSolar with stage titles:
1. Contracts
2. Design
3. Site Schedule
4. Design & Engineering
5. Notice to Proceed
6. Permitting / Utility / HOA
7. Installation Scheduled
8. Financing Package
9. Inspection
10. PTO & O&M

Required subtasks per stage should follow the business checklist from your approved project plan.

## 7) Testing Checklist

1. New webhook with unknown contact creates contact + opportunity.
2. Replayed webhook with same `event_id` is skipped.
3. Stage moves only forward.
4. File mirror uploads once and does not duplicate on replay.
5. Contact has updated `os_last_event_id` and `os_docs_manifest_json`.
6. Portal displays stage/course content and mirrored docs.
