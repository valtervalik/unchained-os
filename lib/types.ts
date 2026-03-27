// ─── Core Financial Types ──────────────────────────────────────────────────

export type DecisionLabel = 'STRONG BUY' | 'VIABLE' | 'RISKY' | 'REJECT'

export type DealStage =
  | 'Lead'
  | 'Analyzed'
  | 'Viable'
  | 'Negotiation'
  | 'Active'
  | 'Scaling'
  | 'Exit'
  | 'Failed'

export type ScenarioType = 'Conservative' | 'Realistic' | 'Aggressive'

export type ProjectionMode = 'Linear' | 'Compound'

// ─── Module A — Deal Analyzer Inputs ──────────────────────────────────────

export interface DealAnalyzerInputs {
  monthlyRevenue: number        // R
  expectedRevenueIncrease: number // ΔR
  currentMargin: number         // current margin %
  optimizedMargin: number       // M2 — optimized margin %
  investment: number            // I
  ownershipPct: number          // P — ownership %
}

// ─── Module B — Qualitative Analysis ──────────────────────────────────────

export interface QualitativeScores {
  product: number      // 1–5
  market: number       // 1–5
  margins: number      // 1–5
  owner: number        // 1–5 (CRITICAL: <3 = auto reject)
  scalability: number  // 1–5
  risk: number         // 1–5 (inverse — lower is better risk)
}

// ─── Module C — Projection ────────────────────────────────────────────────

export interface ProjectionPoint {
  month: number
  revenue: number
  profit: number
  investorIncome: number
  roi: number
  cumulative: number
  paybackReached: boolean
}

export interface ProjectionResult {
  mode: ProjectionMode
  points: ProjectionPoint[]
  paybackMonth: number | null
}

// ─── Computed Results ─────────────────────────────────────────────────────

export interface DealCalculations {
  generatedProfit: number       // ΔR × M2
  investorMonthlyIncome: number // Profit × P
  paybackPeriod: number         // I / Investor Income
  decision: DecisionLabel
}

export interface QualitativeResult {
  totalScore: number
  autoReject: boolean
  warnings: string[]
  projectionMultiplier: number  // from Module E
}

// ─── Scenario ─────────────────────────────────────────────────────────────

export interface ScenarioResult {
  type: ScenarioType
  adjustedDeltaR: number
  adjustedM2: number
  calculations: DealCalculations
  projection3m: ProjectionPoint[]
  projection6m: ProjectionPoint[]
  projection12m: ProjectionPoint[]
}

// ─── Real Performance Data ────────────────────────────────────────────────

export interface MonthlyActual {
  month: number          // 1-based
  year: number
  revenue: number
  profit: number
  investorIncome: number
}

// ─── Deal (CRM Entity) ────────────────────────────────────────────────────

export interface Deal {
  id: string
  // Basic
  name: string
  industry: string
  createdAt: string      // ISO date
  stage: DealStage
  notes: string

  // Financial inputs
  inputs: DealAnalyzerInputs

  // Qualitative inputs
  qualitative: QualitativeScores

  // Computed
  calculations: DealCalculations
  qualitativeResult: QualitativeResult

  // Projections
  projections: {
    linear3m: ProjectionPoint[]
    linear6m: ProjectionPoint[]
    linear12m: ProjectionPoint[]
    compound3m: ProjectionPoint[]
    compound6m: ProjectionPoint[]
    compound12m: ProjectionPoint[]
  }

  // Scenarios
  scenarios: ScenarioResult[]

  // Actual performance
  actuals: MonthlyActual[]
}

// ─── Module F — Comparator Score ─────────────────────────────────────────

export interface DealScore {
  dealId: string
  roiScore: number
  paybackScore: number
  qualitativeScore: number
  riskScore: number
  totalScore: number
  capitalEfficiency: number
  filtered: boolean
  filterReason?: string
}

// ─── Module L — Investor ──────────────────────────────────────────────────

export interface InvestorDealAllocation {
  dealId: string
  amount: number
  ownershipPct: number
}

export interface Investor {
  id: string
  name: string
  capitalCommitted: number
  capitalDeployed: number
  allocations: InvestorDealAllocation[]
  createdAt: string
}

// ─── Module K — Capital Allocation ───────────────────────────────────────

export interface CapitalAllocation {
  availableCapital: number
  avgInvestment: number
  dealsPossible: number
  distribution: { dealId: string; amount: number }[]
  expectedMonthlyReturn: number
}

// ─── Alert ────────────────────────────────────────────────────────────────

export type AlertSeverity = 'warning' | 'critical' | 'info'

export interface Alert {
  id: string
  dealId: string
  dealName: string
  message: string
  severity: AlertSeverity
  createdAt: string
  dismissed: boolean
}
