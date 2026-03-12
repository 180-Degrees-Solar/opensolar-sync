// GHL pipeline stage name -> portal stage number
// Keys are case-sensitive; add variations as needed
export const GHL_STAGE_MAP: Record<string, number> = {
  // Stage 1: Contracts
  'Contracts': 1,
  'Contract Signed': 1,
  'Docs Out': 1,
  // Stage 2: Design
  'Design': 2,
  'Design in Progress': 2,
  'CAD': 2,
  // Stage 3: Site Schedule
  'Site Schedule': 3,
  'Site Survey Scheduled': 3,
  'Site Survey': 3,
  // Stage 4: Design & Engineering
  'Design & Engineering': 4,
  'Engineering Review': 4,
  'Final Design': 4,
  // Stage 5: NTP
  'Notice to Proceed': 5,
  'Notice to Proceed (NTP)': 5,
  'NTP Approved': 5,
  'NTP Issued': 5,
  'NTP': 5,
  // Stage 6: Permitting
  'Permitting / Utility / HOA': 6,
  'Permitting / Interconnection / Utility / HOA': 6,
  'Permitting': 6,
  'HOA': 6,
  'Utility': 6,
  'Interconnection': 6,
  // Stage 7: Installation
  'Installation Scheduled': 7,
  'Install Scheduled': 7,
  'Install In Progress': 7,
  // Stage 8: Financing
  'Financing Package': 8,
  'Escrow Funded': 8,
  'Finance Package': 8,
  // Stage 9: Inspection
  'Inspection': 9,
  'Inspection Scheduled': 9,
  'Inspection Complete': 9,
  // Stage 10: PTO & O&M
  'PTO & O&M': 10,
  'PTO': 10,
  'Monitoring': 10,
  'Permission to Operate': 10,
}

// OpenSolar event_type_id -> portal stage number
// Event 56 (Stage Changed) is handled separately in code
export const OPENSOLAR_EVENT_MAP: Record<number, number> = {
  52: 1,   // DocuSign Contract Completed
  63: 1,   // DocuSign Contract Signed
  61: 1,   // Customer Signed Loan Agreement
  62: 8,   // Loan Agreement Complete -> Financing Package
  72: 5,   // Notice to Proceed Issued
  40: 7,   // On-site Installation
  104: 7,  // Project Marked as Installed
  103: 1,  // Project Marked as Sold
}

export function mapGhlStageToPortal(stageName: string): number | null {
  return GHL_STAGE_MAP[stageName] ?? null
}

export function mapOpenSolarEventToPortal(eventTypeId: number): number | null {
  return OPENSOLAR_EVENT_MAP[eventTypeId] ?? null
}
