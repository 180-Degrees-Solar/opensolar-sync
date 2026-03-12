const EXACT_STAGE_NAMES = [
  'Contracts',
  'Design',
  'Site Schedule',
  'Design & Engineering',
  'Notice to Proceed',
  'Permitting / Utility / HOA',
  'Installation Scheduled',
  'Financing Package',
  'Inspection',
  'PTO & O&M',
] as const

export type ExactStageName = (typeof EXACT_STAGE_NAMES)[number]

export interface StageResolution {
  stageNumber: number
  stageName: ExactStageName
}

const STAGE_ALIASES: Record<string, number> = {
  contracts: 1,
  design: 2,
  'site schedule': 3,
  'site survey': 3,
  'design & engineering': 4,
  'engineering review': 4,
  'final design': 4,
  'notice to proceed': 5,
  ntp: 5,
  'notice to proceed (ntp)': 5,
  permitting: 6,
  utility: 6,
  hoa: 6,
  interconnection: 6,
  'permitting / interconnection / utility / hoa': 6,
  'permitting / utility / hoa': 6,
  'installation scheduled': 7,
  'install scheduled': 7,
  'install in progress': 7,
  'financing package': 8,
  'finance package': 8,
  'escrow funded': 8,
  inspection: 9,
  pto: 10,
  monitoring: 10,
  'permission to operate': 10,
  'pto & o&m': 10,
}

function parseStageIdMapFromEnv(): Record<string, number> {
  const raw = process.env.OPENSOLAR_STAGE_ID_MAP_JSON
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [String(k), Number(v)])
    )
  } catch {
    return {}
  }
}

function normalizeStageName(value: string): string {
  return value.trim().toLowerCase()
}

export function getExactStageName(stageNumber: number): ExactStageName | null {
  if (stageNumber < 1 || stageNumber > EXACT_STAGE_NAMES.length) {
    return null
  }

  return EXACT_STAGE_NAMES[stageNumber - 1]
}

export function resolveStageFromOpenSolar(params: {
  activeStageId?: string | number | null
  stageName?: string | null
}): StageResolution | null {
  const stageIdMap = parseStageIdMapFromEnv()

  if (params.activeStageId != null) {
    const mapped = stageIdMap[String(params.activeStageId)]
    if (mapped) {
      const exact = getExactStageName(mapped)
      if (exact) {
        return { stageNumber: mapped, stageName: exact }
      }
    }
  }

  if (params.stageName) {
    const normalized = normalizeStageName(params.stageName)
    const mapped = STAGE_ALIASES[normalized]
    if (mapped) {
      const exact = getExactStageName(mapped)
      if (exact) {
        return { stageNumber: mapped, stageName: exact }
      }
    }
  }

  return null
}
