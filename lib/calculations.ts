import type {
  DealAnalyzerInputs,
  QualitativeScores,
  DealCalculations,
  QualitativeResult,
  DecisionLabel,
  ProjectionPoint,
  ProjectionMode,
  ScenarioResult,
  ScenarioType,
  Deal,
  DealScore,
} from './types'

// ─── Module A — Deal Analyzer ─────────────────────────────────────────────

export function calcDeal(inputs: DealAnalyzerInputs): DealCalculations {
  const { expectedRevenueIncrease, optimizedMargin, investment, ownershipPct } = inputs
  const m2 = optimizedMargin / 100
  const p = ownershipPct / 100

  const generatedProfit = expectedRevenueIncrease * m2
  const investorMonthlyIncome = generatedProfit * p
  const paybackPeriod = investorMonthlyIncome > 0 ? investment / investorMonthlyIncome : Infinity

  let decision: DecisionLabel
  if (paybackPeriod <= 6) decision = 'STRONG BUY'
  else if (paybackPeriod <= 12) decision = 'VIABLE'
  else if (paybackPeriod <= 18) decision = 'RISKY'
  else decision = 'REJECT'

  return { generatedProfit, investorMonthlyIncome, paybackPeriod, decision }
}

// ─── Module B — Qualitative Analysis ─────────────────────────────────────

export function calcQualitative(scores: QualitativeScores): QualitativeResult {
  const { product, market, margins, owner, scalability, risk } = scores
  const totalScore = product + market + margins + owner + scalability + (6 - risk)

  const warnings: string[] = []
  const autoReject = owner < 3
  if (autoReject) warnings.push('Owner score < 3 — AUTO REJECT')
  if (scalability < 3) warnings.push('Scalability score < 3 — WARNING')
  if (margins < 3) warnings.push('Margins score < 3 — WARNING')

  let projectionMultiplier = 1
  if (totalScore >= 25) projectionMultiplier = 1.1
  else if (totalScore >= 20) projectionMultiplier = 1
  else if (totalScore >= 15) projectionMultiplier = 0.85
  else {
    projectionMultiplier = 0.7
    warnings.push('Qualitative score < 15 — -30% adjustment on projections')
  }

  return { totalScore, autoReject, warnings, projectionMultiplier }
}

// ─── Module C — Projection Engine ────────────────────────────────────────

export function calcProjections(
  inputs: DealAnalyzerInputs,
  mode: ProjectionMode,
  months: number,
  qualMultiplier: number,
  scenarioMultiplierR = 1,
  scenarioMultiplierM2 = 1,
): ProjectionPoint[] {
  const { monthlyRevenue, expectedRevenueIncrease, optimizedMargin, investment, ownershipPct } = inputs
  const m2 = ((optimizedMargin / 100) * scenarioMultiplierM2)
  const p = ownershipPct / 100
  const deltaR = expectedRevenueIncrease * scenarioMultiplierR * qualMultiplier

  const points: ProjectionPoint[] = []
  let cumulative = 0
  let paybackReached = false

  for (let month = 1; month <= months; month++) {
    let revenue: number
    if (mode === 'Linear') {
      revenue = monthlyRevenue + deltaR * month
    } else {
      // Compound: monthly growth rate derived from deltaR
      const growthRate = deltaR / monthlyRevenue
      revenue = monthlyRevenue * Math.pow(1 + growthRate / 12, month)
    }

    const profit = revenue * m2
    const investorIncome = profit * p
    const roi = investment > 0 ? (investorIncome / investment) * 100 : 0

    cumulative += investorIncome
    if (!paybackReached && cumulative >= investment) paybackReached = true

    points.push({ month, revenue, profit, investorIncome, roi, cumulative, paybackReached })
  }

  return points
}

// ─── Module D — Scenario Engine ──────────────────────────────────────────

const SCENARIO_FACTORS: Record<ScenarioType, { r: number; m2: number }> = {
  Conservative: { r: 0.7, m2: 0.9 },
  Realistic: { r: 1.0, m2: 1.0 },
  Aggressive: { r: 1.3, m2: 1.1 },
}

export function calcScenarios(
  inputs: DealAnalyzerInputs,
  qualMultiplier: number,
): ScenarioResult[] {
  return (['Conservative', 'Realistic', 'Aggressive'] as ScenarioType[]).map((type) => {
    const { r, m2 } = SCENARIO_FACTORS[type]
    const adjustedDeltaR = inputs.expectedRevenueIncrease * r
    const adjustedM2 = inputs.optimizedMargin * m2

    const adjInputs = { ...inputs, expectedRevenueIncrease: adjustedDeltaR, optimizedMargin: adjustedM2 }
    const calculations = calcDeal(adjInputs)

    return {
      type,
      adjustedDeltaR,
      adjustedM2,
      calculations,
      projection3m: calcProjections(inputs, 'Linear', 3, qualMultiplier, r, m2),
      projection6m: calcProjections(inputs, 'Linear', 6, qualMultiplier, r, m2),
      projection12m: calcProjections(inputs, 'Linear', 12, qualMultiplier, r, m2),
    }
  })
}

// ─── Module F — Deal Comparator ───────────────────────────────────────────

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

export function scoreDeal(deal: Deal, allDeals: Deal[]): DealScore {
  const { calculations, qualitativeResult, inputs } = deal

  // Auto-filter checks
  if (qualitativeResult.autoReject) {
    return {
      dealId: deal.id,
      roiScore: 0, paybackScore: 0, qualitativeScore: 0, riskScore: 0,
      totalScore: 0, capitalEfficiency: 0,
      filtered: true, filterReason: 'Owner score < 3',
    }
  }
  if (calculations.paybackPeriod > 18) {
    return {
      dealId: deal.id,
      roiScore: 0, paybackScore: 0, qualitativeScore: 0, riskScore: 0,
      totalScore: 0, capitalEfficiency: 0,
      filtered: true, filterReason: 'Payback period > 18 months',
    }
  }

  const allROIs = allDeals.map(d => d.calculations.investorMonthlyIncome / d.inputs.investment)
  const allPaybacks = allDeals.map(d => d.calculations.paybackPeriod).filter(p => isFinite(p))
  const allQual = allDeals.map(d => d.qualitativeResult.totalScore)
  const allRisks = allDeals.map(d => d.qualitative.risk)

  const roi = calculations.investorMonthlyIncome / inputs.investment
  const roiScore = normalize(roi, Math.min(...allROIs), Math.max(...allROIs))
  // Payback: inverse (lower is better)
  const paybackScore = 100 - normalize(
    calculations.paybackPeriod,
    Math.min(...allPaybacks),
    Math.max(...allPaybacks),
  )
  const qualitativeScore = normalize(qualitativeResult.totalScore, Math.min(...allQual), Math.max(...allQual))
  // Risk: inverse (lower risk score number = lower risk = better)
  const riskScore = 100 - normalize(deal.qualitative.risk, Math.min(...allRisks), Math.max(...allRisks))

  const totalScore =
    roiScore * 0.35 +
    paybackScore * 0.25 +
    qualitativeScore * 0.25 +
    riskScore * 0.15

  if (totalScore < 15) {
    return {
      dealId: deal.id,
      roiScore, paybackScore, qualitativeScore, riskScore, totalScore,
      capitalEfficiency: calculations.investorMonthlyIncome / inputs.investment,
      filtered: true, filterReason: 'Total score < 15',
    }
  }

  return {
    dealId: deal.id,
    roiScore,
    paybackScore,
    qualitativeScore,
    riskScore,
    totalScore,
    capitalEfficiency: calculations.investorMonthlyIncome / inputs.investment,
    filtered: false,
  }
}

// ─── Module H — Performance Ratio ────────────────────────────────────────

export function calcPerformanceRatio(actual: number, projected: number): number {
  if (projected === 0) return 0
  return actual / projected
}

export function performanceLabel(ratio: number): string {
  if (ratio > 1) return 'Outperforming'
  if (ratio === 1) return 'On Track'
  return 'Underperforming'
}

// ─── Module I — Alerts ────────────────────────────────────────────────────

export function calcRevenueDev(actual: number, projected: number): number {
  if (projected === 0) return 0
  return ((actual - projected) / projected) * 100
}

// ─── Formatting helpers ───────────────────────────────────────────────────

export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtCurrency(n: number): string {
  return '$' + fmt(n, 0)
}

export function fmtPct(n: number, decimals = 1): string {
  return fmt(n, decimals) + '%'
}

export function decisionColor(d: DecisionLabel): string {
  switch (d) {
    case 'STRONG BUY': return 'text-emerald-400'
    case 'VIABLE': return 'text-blue-400'
    case 'RISKY': return 'text-yellow-400'
    case 'REJECT': return 'text-red-400'
  }
}

export function decisionBg(d: DecisionLabel): string {
  switch (d) {
    case 'STRONG BUY': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'VIABLE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'RISKY': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'REJECT': return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
}
