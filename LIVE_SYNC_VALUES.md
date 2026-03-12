# Live Sync Values

Use these values in your deployment environment and n8n workflow.

## GHL Location + Pipeline

- `GHL_LOCATION_ID`: `PSr0Nobj9m4lBrO9LPEY`
- `GHL_PIPELINE_ID`: `2zJrL7euC76Jt9wHQtUZ`

## GHL Stage ID Map JSON

Set this as `GHL_STAGE_ID_MAP_JSON`:

```json
{
  "Contracts": "35873ced-7bc4-4955-a913-2fc42c3f58a1",
  "Design": "50ea5c4f-2367-4c52-ab90-69de71f94433",
  "Site Schedule": "c943ba23-6253-42ba-9aaf-b282ea01a594",
  "Design & Engineering": "c6a5d98c-169b-4032-995b-e849680b97e7",
  "Notice to Proceed": "4c78d2a4-e5db-48b8-9c5e-042eeda27da6",
  "Permitting / Utility / HOA": "fbfaf7e5-b7aa-434c-a466-4a22543a7302",
  "Installation Scheduled": "b48810c5-1da1-47f8-b91d-6e0d0db11ce6",
  "Financing Package": "c5580016-f346-4910-94d9-e189df6b5ed8",
  "Inspection": "9ff1cee1-22be-4a65-b8d1-a6df4cd1a6be",
  "PTO & O&M": "d8aad801-8353-4e33-a800-a550f55c897c"
}
```

## OpenSolar Workflow Map JSON

Set this as `OPENSOLAR_STAGE_ID_MAP_JSON`:

```json
{
  "976783": 1,
  "976784": 2,
  "976785": 3,
  "976790": 4,
  "976786": 5,
  "976788": 6,
  "976787": 7,
  "976789": 8
}
```

## OpenSolar Workflow Details

- `workflow_id`: `162051`
- `workflow_title`: `GFI Workflow`

## Important Note

Your GHL stage 10 is currently named `PTO / O&M` while your desired canonical name is `PTO & O&M`.
The mapping above handles this safely because it maps by ID, not display name.
