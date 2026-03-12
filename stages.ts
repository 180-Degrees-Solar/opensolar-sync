export interface StageDefinition {
  number: number
  title: string
  description: string
  timeframe: string
  whatHappens: string
}

export const STAGES: StageDefinition[] = [
  {
    number: 1,
    title: 'Contracts',
    description: 'Contract signing and documentation phase.',
    timeframe: '1-2 weeks',
    whatHappens: 'Sales agreement is finalized, contracts are signed by homeowner, and project officially begins.',
  },
  {
    number: 2,
    title: 'Design',
    description: 'Initial system design based on site data.',
    timeframe: '1-2 weeks',
    whatHappens: 'Engineering team creates preliminary solar system design based on satellite imagery and utility data.',
  },
  {
    number: 3,
    title: 'Site Schedule',
    description: 'Site survey scheduling and execution.',
    timeframe: '1-2 weeks',
    whatHappens: 'A site surveyor visits the property to assess roof condition, shading, electrical panel, and take measurements.',
  },
  {
    number: 4,
    title: 'Design & Engineering',
    description: 'Final engineering design and plan set creation.',
    timeframe: '2-3 weeks',
    whatHappens: 'Engineers finalize the system design incorporating site survey data, creating permit-ready plan sets.',
  },
  {
    number: 5,
    title: 'Notice to Proceed',
    description: 'Approval to proceed with permitting and installation.',
    timeframe: '1 week',
    whatHappens: 'All pre-construction requirements are met. NTP is issued to begin permitting and scheduling installation.',
  },
  {
    number: 6,
    title: 'Permitting / Utility / HOA',
    description: 'Permits, utility approvals, and HOA clearance.',
    timeframe: '2-6 weeks',
    whatHappens: 'Building permits submitted, utility interconnection applied for, and HOA approval obtained if required.',
  },
  {
    number: 7,
    title: 'Installation Scheduled',
    description: 'Physical installation of the solar system.',
    timeframe: '1-3 days',
    whatHappens: 'Installation crew arrives to mount panels, install inverter, and complete electrical connections.',
  },
  {
    number: 8,
    title: 'Financing Package',
    description: 'Financing finalization and funding.',
    timeframe: '1-2 weeks',
    whatHappens: 'Loan documents finalized, escrow funded, and financing package completed.',
  },
  {
    number: 9,
    title: 'Inspection',
    description: 'Municipal and utility inspection.',
    timeframe: '1-2 weeks',
    whatHappens: 'City/county building inspector and utility company verify the installation meets code and interconnection requirements.',
  },
  {
    number: 10,
    title: 'PTO & O&M',
    description: 'Permission to Operate and ongoing monitoring.',
    timeframe: '1-4 weeks',
    whatHappens: 'Utility grants Permission to Operate. System is turned on and monitoring begins. Warranty and O&M period starts.',
  },
]

export function getStageByNumber(num: number): StageDefinition | undefined {
  return STAGES.find((s) => s.number === num)
}
